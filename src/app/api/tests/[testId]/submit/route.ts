import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { getErrorMessage } from "@/lib/errors";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import type { SubmitAnswerInput } from "@/types/api";

type AttemptAnswerCreate = {
  questionId: string;
  selectedOptionId: string | null;
  titaAnswer: string | null;
  isCorrect: boolean;
  isMarkedReview: boolean;
};

function getLocalDateString() {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60 * 1000;
  const istTime = new Date(utc + 3600000 * 5.5);
  return istTime.toISOString().split("T")[0];
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params;
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const rateCheck = checkRateLimit(
      `${getClientIp(req)}:${auth.userId}`,
      RATE_LIMITS.submit
    );
    if (!rateCheck.ok) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Retry in ${rateCheck.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const userId = auth.userId;
    const body = await req.json();
    const { answers, timeSpent } = body as {
      answers: SubmitAnswerInput[];
      timeSpent: number;
    };

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Invalid answers format" }, { status: 400 });
    }

    // Fetch test details
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: {
            question: {
              include: {
                options: true
              }
            }
          }
        }
      }
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Evaluate answers
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    let score = 0;

    const answersToCreate: AttemptAnswerCreate[] = [];

    // Map test questions to evaluate
    const testQuestions = test.questions.map((tq) => tq.question);
    
    for (const q of testQuestions) {
      const submitted = answers.find((a) => a.questionId === q.id);
      
      if (!submitted || (!submitted.selectedOptionId && !submitted.titaAnswer)) {
        unattemptedCount++;
        answersToCreate.push({
          questionId: q.id,
          selectedOptionId: null,
          titaAnswer: null,
          isCorrect: false,
          isMarkedReview: submitted?.isMarkedReview || false,
        });
        continue;
      }

      let isCorrect = false;

      if (q.type === "MCQ") {
        const correctOpt = q.options.find((o) => o.isCorrect);
        isCorrect = correctOpt?.id === submitted.selectedOptionId;

        if (isCorrect) {
          correctCount++;
          score += 3;
        } else {
          incorrectCount++;
          score -= 1; // Negative marking for MCQs
        }
      } else {
        // TITA Type in the Answer
        // Match string exactly or case-insensitive
        const correctOpt = q.options.find((o) => o.isCorrect);
        // Sometimes TITA options have single correct content
        const cleanCorrect = correctOpt?.content.trim().toLowerCase() || q.solution.toLowerCase();
        const cleanSub = (submitted.titaAnswer || "").trim().toLowerCase();
        
        isCorrect = cleanCorrect.includes(cleanSub) || cleanSub.includes(cleanCorrect);

        if (isCorrect) {
          correctCount++;
          score += 3;
        } else {
          incorrectCount++;
          // No negative markings for TITA
        }
      }

      answersToCreate.push({
        questionId: q.id,
        selectedOptionId: submitted.selectedOptionId || null,
        titaAnswer: submitted.titaAnswer || null,
        isCorrect,
        isMarkedReview: submitted.isMarkedReview || false,
      });
    }

    // Calculate accuracy
    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

    // Percentile estimate mapping
    // Full mocks are usually 66 questions, score ranges from -66 to 198.
    // Our mini mocks/tests have fewer questions, let's normalize the score percentage:
    const maxScore = testQuestions.length * 3;
    const pctScore = maxScore > 0 ? (score / maxScore) * 100 : 0;
    
    let percentile = 50.0;
    if (pctScore >= 80) percentile = 99.9;
    else if (pctScore >= 60) percentile = 99.5;
    else if (pctScore >= 45) percentile = 98.0;
    else if (pctScore >= 30) percentile = 95.0;
    else if (pctScore >= 15) percentile = 88.0;
    else if (pctScore >= 5) percentile = 75.0;

    // Save attempt to database
    const attempt = await prisma.attempt.create({
      data: {
        userId,
        testId,
        score,
        percentile,
        accuracy,
        timeSpent,
        correctCount,
        incorrectCount,
        unattemptedCount,
        answers: {
          create: answersToCreate,
        },
      },
    });

    // Update Daily solved targets
    const attemptedAnswers = answersToCreate.filter(
      (a) => a.selectedOptionId !== null || (a.titaAnswer !== null && a.titaAnswer !== "")
    );
    const questionIds = attemptedAnswers.map((a) => a.questionId);
    
    let quantSolvedIncrement = 0;
    let varcSolvedIncrement = 0;
    let lrdiSolvedIncrement = 0;

    if (questionIds.length > 0) {
      const questionsWithCategories = await prisma.question.findMany({
        where: { id: { in: questionIds } },
        include: {
          subtopic: {
            include: {
              topic: true,
            },
          },
        },
      });

      questionsWithCategories.forEach((q) => {
        const category = q.subtopic?.topic?.category;
        if (category === "QUANT") quantSolvedIncrement++;
        else if (category === "VARC") varcSolvedIncrement++;
        else if (category === "LRDI") lrdiSolvedIncrement++;
      });
    }

    if (quantSolvedIncrement === 0 && varcSolvedIncrement === 0 && lrdiSolvedIncrement === 0) {
      const attemptedCount = attemptedAnswers.length;
      if (test.category === "QUANT") quantSolvedIncrement = attemptedCount;
      else if (test.category === "VARC") varcSolvedIncrement = attemptedCount;
      else if (test.category === "LRDI") lrdiSolvedIncrement = attemptedCount;
    }

    if (quantSolvedIncrement > 0 || varcSolvedIncrement > 0 || lrdiSolvedIncrement > 0) {
      const dateStr = getLocalDateString();
      await prisma.dailyGoalProgress.upsert({
        where: {
          userId_date: {
            userId,
            date: dateStr,
          },
        },
        update: {
          quantSolved: { increment: quantSolvedIncrement },
          varcSolved: { increment: varcSolvedIncrement },
          lrdiSolved: { increment: lrdiSolvedIncrement },
        },
        create: {
          userId,
          date: dateStr,
          quantGoal: 10,
          varcGoal: 6,
          lrdiGoal: 4,
          quantSolved: quantSolvedIncrement,
          varcSolved: varcSolvedIncrement,
          lrdiSolved: lrdiSolvedIncrement,
        },
      });
    }

    // Check off Topic Test completion milestone in UserProgress
    // We can find the subtopicId from one of the questions
    const sampleQuestion = testQuestions.find((q) => q.subtopicId);
    if (sampleQuestion?.subtopicId && test.type === "TOPIC") {
      await prisma.userProgress.upsert({
        where: {
          userId_subtopicId: {
            userId,
            subtopicId: sampleQuestion.subtopicId,
          },
        },
        update: {
          topicTestCompleted: true,
        },
        create: {
          userId,
          subtopicId: sampleQuestion.subtopicId,
          topicTestCompleted: true,
        },
      });
    }

    // Check achievement triggers
    // 2. First mock attempted achievement
    if (test.type === "MOCK") {
      const existingAch = await prisma.achievement.findFirst({
        where: { userId, title: "First Mock Attempted" }
      });
      if (!existingAch) {
        await prisma.achievement.create({
          data: {
            title: "First Mock Attempted",
            description: "Submitted your first full-length CAT mock test.",
            userId
          }
        });
      }
    }

    return NextResponse.json({ success: true, attemptId: attempt.id });
  } catch (error: unknown) {
    console.error("Submit test error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
