import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserId } from "@/lib/pyq/auth";
import { evaluateAnswer, scoreSection, estimatePercentile } from "@/lib/pyq/scoring";
import type { CatSection } from "@/lib/pyq/constants";

async function updateUserAnalytics(
  userId: string,
  score: number,
  percentile: number,
  sectionScores: { section: string; accuracy: number }[]
) {
  const existing = await prisma.userAnalytics.findUnique({ where: { userId } });
  const testsTaken = (existing?.testsTaken ?? 0) + 1;
  const pyqMocksTaken = (existing?.pyqMocksTaken ?? 0) + 1;
  const bestScore = Math.max(existing?.bestScore ?? 0, score);
  const bestPercentile = Math.max(existing?.bestPercentile ?? 0, percentile);
  const avgScore =
    ((existing?.averageScore ?? 0) * (testsTaken - 1) + score) / testsTaken;
  const avgPercentile =
    ((existing?.averagePercentile ?? 0) * (testsTaken - 1) + percentile) / testsTaken;

  const sorted = [...sectionScores].sort((a, b) => b.accuracy - a.accuracy);
  const strongest = sorted[0]?.section;
  const weakest = sorted[sorted.length - 1]?.section;

  const weekKey = new Date().toISOString().slice(0, 10);
  const weekly: { date: string; score: number }[] = existing?.weeklyProgressJson
    ? JSON.parse(existing.weeklyProgressJson)
    : [];
  weekly.push({ date: weekKey, score });
  const weeklyTrimmed = weekly.slice(-30);

  const monthKey = new Date().toISOString().slice(0, 7);
  const monthly: { month: string; avgScore: number; count: number }[] = existing?.monthlyProgressJson
    ? JSON.parse(existing.monthlyProgressJson)
    : [];
  const mIdx = monthly.findIndex((m) => m.month === monthKey);
  if (mIdx >= 0) {
    const m = monthly[mIdx];
    monthly[mIdx] = {
      month: monthKey,
      avgScore: (m.avgScore * m.count + score) / (m.count + 1),
      count: m.count + 1,
    };
  } else {
    monthly.push({ month: monthKey, avgScore: score, count: 1 });
  }

  await prisma.userAnalytics.upsert({
    where: { userId },
    create: {
      userId,
      testsTaken,
      pyqMocksTaken,
      bestScore,
      averageScore: avgScore,
      bestPercentile,
      averagePercentile: avgPercentile,
      strongestSection: strongest,
      weakestSection: weakest,
      weeklyProgressJson: JSON.stringify(weeklyTrimmed),
      monthlyProgressJson: JSON.stringify(monthly.slice(-12)),
    },
    update: {
      testsTaken,
      pyqMocksTaken,
      bestScore,
      averageScore: avgScore,
      bestPercentile,
      averagePercentile: avgPercentile,
      strongestSection: strongest,
      weakestSection: weakest,
      weeklyProgressJson: JSON.stringify(weeklyTrimmed),
      monthlyProgressJson: JSON.stringify(monthly.slice(-12)),
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ paperId: string }> }
) {
  try {
    const userId = await resolveUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { checkRateLimit, getClientIp, RATE_LIMITS } = await import("@/lib/rate-limit");
    const rateCheck = checkRateLimit(`${getClientIp(req)}:${userId}`, RATE_LIMITS.submit);
    if (!rateCheck.ok) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Retry in ${rateCheck.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const { paperId } = await params;
    const body = await req.json();
    const { answers, questionTimes, timeSpent, sessionId } = body as {
      answers: Record<
        string,
        {
          selectedOptionId: string | null;
          titaAnswer: string;
          isMarkedReview: boolean;
          visited: boolean;
          section: CatSection;
        }
      >;
      questionTimes: Record<string, number>;
      timeSpent: number;
      sessionId?: string;
    };

    const paper = await prisma.catPyqPaper.findUnique({
      where: { id: paperId },
      include: {
        sections: {
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: { question: { include: { options: true } } },
            },
          },
        },
      },
    });

    if (!paper) return NextResponse.json({ error: "Paper not found" }, { status: 404 });

    const allQuestions = paper.sections.flatMap((sec) =>
      sec.questions.map((pq) => ({
        ...pq.question,
        section: sec.section as CatSection,
        order: pq.order,
      }))
    );

    const answersToCreate: {
      questionId: string;
      section: string;
      selectedOptionId: string | null;
      titaAnswer: string | null;
      isCorrect: boolean;
      isMarkedReview: boolean;
      visited: boolean;
      timeSpentSeconds: number;
    }[] = [];

    const sectionAnswerMap: Record<CatSection, { isCorrect: boolean; attempted: boolean; type: "MCQ" | "TITA" }[]> = {
      VARC: [],
      DILR: [],
      QA: [],
    };

    for (const q of allQuestions) {
      const state = answers[q.id];
      const correctOpt = q.options.find((o) => o.isCorrect);
      const attempted = !!(state?.selectedOptionId || state?.titaAnswer?.trim());

      const isCorrect = attempted
        ? evaluateAnswer({
            questionId: q.id,
            section: q.section,
            type: q.type as "MCQ" | "TITA",
            selectedOptionId: state?.selectedOptionId,
            titaAnswer: state?.titaAnswer,
            correctOptionId: correctOpt?.id,
            correctTita: correctOpt?.content,
          })
        : false;

      sectionAnswerMap[q.section].push({
        isCorrect,
        attempted,
        type: q.type as "MCQ" | "TITA",
      });

      answersToCreate.push({
        questionId: q.id,
        section: q.section,
        selectedOptionId: state?.selectedOptionId ?? null,
        titaAnswer: state?.titaAnswer || null,
        isCorrect,
        isMarkedReview: state?.isMarkedReview ?? false,
        visited: state?.visited ?? false,
        timeSpentSeconds: questionTimes?.[q.id] ?? 0,
      });
    }

    const sectionScoresData = (["VARC", "DILR", "QA"] as CatSection[]).map((sec) => {
      const s = scoreSection(sectionAnswerMap[sec]);
      return { section: sec, ...s };
    });

    const totalScore = sectionScoresData.reduce((a, s) => a + s.score, 0);
    const totalCorrect = sectionScoresData.reduce((a, s) => a + s.correct, 0);
    const totalIncorrect = sectionScoresData.reduce((a, s) => a + s.incorrect, 0);
    const totalUnattempted = sectionScoresData.reduce((a, s) => a + s.unattempted, 0);
    const maxScore = allQuestions.length * 3;
    const pctOfMax = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const percentile = estimatePercentile(pctOfMax);
    const attemptedTotal = totalCorrect + totalIncorrect;
    const accuracy = attemptedTotal > 0 ? Math.round((totalCorrect / attemptedTotal) * 100) : 0;

    const attempt = await prisma.attempt.create({
      data: {
        userId,
        catPyqPaperId: paperId,
        testId: null,
        score: totalScore,
        percentile,
        accuracy,
        timeSpent: timeSpent ?? 0,
        correctCount: totalCorrect,
        incorrectCount: totalIncorrect,
        unattemptedCount: totalUnattempted,
        answers: { create: answersToCreate },
        sectionScores: {
          create: sectionScoresData.map((s) => ({
            section: s.section,
            score: s.score,
            correctCount: s.correct,
            incorrectCount: s.incorrect,
            unattemptedCount: s.unattempted,
            attemptedCount: s.attempted,
            accuracy: s.accuracy,
            timeSpent: Math.round((timeSpent ?? 0) / 3),
          })),
        },
      },
    });

    if (sessionId) {
      await prisma.examSession.updateMany({
        where: { id: sessionId, userId },
        data: { completed: true },
      });
    }

    await updateUserAnalytics(
      userId,
      totalScore,
      percentile,
      sectionScoresData.map((s) => ({ section: s.section, accuracy: s.accuracy }))
    );

    const existingPyqAch = await prisma.achievement.findFirst({
      where: { userId, title: "First PYQ Mock Completed" },
    });
    if (!existingPyqAch) {
      await prisma.achievement.create({
        data: {
          userId,
          title: "First PYQ Mock Completed",
          description: "Completed your first Previous Year CAT full mock.",
        },
      });
    }

    return NextResponse.json({ success: true, attemptId: attempt.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("PYQ submit error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
