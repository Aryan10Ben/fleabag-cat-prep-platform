import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { getErrorMessage } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

function getLocalDateString() {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60 * 1000;
  const istTime = new Date(utc + 3600000 * 5.5);
  return istTime.toISOString().split("T")[0];
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const userId = auth.userId;

    // Fetch user details for streak
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true, name: true },
    });

    // Fetch progress rows
    let progressRows = await prisma.userProgress.findMany({
      where: { userId },
      include: {
        subtopic: {
          include: {
            topic: true,
          },
        },
      },
    });

    // If no progress records, seed them on-the-fly for this user
    if (progressRows.length === 0) {
      const allSubtopics = await prisma.subtopic.findMany();
      
      if (allSubtopics.length === 0) {
        // Return empty progress structure to prevent infinite recursion if database is not seeded
        return NextResponse.json({
          userName: user?.name,
          streak: user?.streak || 0,
          overallProgress: 0,
          quantProgress: 0,
          varcProgress: 0,
          lrdiProgress: 0,
          topicProgress: {},
          recentAttempts: [],
          achievements: [],
          rawProgress: [],
          dailyGoalProgress: null,
          weakAreas: [],
          revisionPending: [],
          sectionTopicCaptions: { QUANT: "", VARC: "", LRDI: "" },
        });
      }

      await prisma.userProgress.createMany({
        data: allSubtopics.map((sub) => ({
          userId,
          subtopicId: sub.id,
          formulaSheetRead: false,
          practiceQuestionsCompleted: false,
          topicTestCompleted: false,
          revisionDone: false,
        })),
      });

      // Re-fetch directly assigning to progressRows
      progressRows = await prisma.userProgress.findMany({
        where: { userId },
        include: {
          subtopic: {
            include: {
              topic: true,
            },
          },
        },
      });
    }

        // Calculate percentages based on actual questions correctly answered
    const totalQuestions = await prisma.question.findMany({
      include: { subtopic: { include: { topic: true } } }
    });
    
    let quantTotalQuestions = 0;
    let varcTotalQuestions = 0;
    let lrdiTotalQuestions = 0;

    totalQuestions.forEach(q => {
      const cat = q.subtopic?.topic?.category;
      if (cat === "QUANT") quantTotalQuestions++;
      else if (cat === "VARC") varcTotalQuestions++;
      else if (cat === "LRDI") lrdiTotalQuestions++;
    });

    // We fetch attemptAnswers later in the file, so we need to calculate correct unique questions here.
    const allAttemptAnswers = await prisma.attemptAnswer.findMany({
      where: { attempt: { userId }, isCorrect: true },
      select: { questionId: true }
    });
    const uniqueCorrectQIds = new Set(allAttemptAnswers.map(a => a.questionId));

    let quantCorrect = 0;
    let varcCorrect = 0;
    let lrdiCorrect = 0;
    
    uniqueCorrectQIds.forEach(qid => {
      const q = totalQuestions.find(x => x.id === qid);
      if (q) {
        const cat = q.subtopic?.topic?.category;
        if (cat === "QUANT") quantCorrect++;
        else if (cat === "VARC") varcCorrect++;
        else if (cat === "LRDI") lrdiCorrect++;
      }
    });

    const totalBank = quantTotalQuestions + varcTotalQuestions + lrdiTotalQuestions;
    const totalCorrect = quantCorrect + varcCorrect + lrdiCorrect;

    const overallProgress = totalBank > 0 ? Math.round((totalCorrect / totalBank) * 100) : 0;
    const quantProgress = quantTotalQuestions > 0 ? Math.round((quantCorrect / quantTotalQuestions) * 100) : 0;
    const varcProgress = varcTotalQuestions > 0 ? Math.round((varcCorrect / varcTotalQuestions) * 100) : 0;
    const lrdiProgress = lrdiTotalQuestions > 0 ? Math.round((lrdiCorrect / lrdiTotalQuestions) * 100) : 0;

    // Build topicProgress
    const topicProgress: Record<string, { total: number; completed: number }> = {};
    progressRows.forEach((row) => {
      topicProgress[row.subtopic.name] = { total: 4, completed: 0 }; // Legacy
    });

    // Fetch recent attempts
    const recentAttempts = await prisma.attempt.findMany({
      where: { userId },
      include: { 
        test: true,
        catPyqPaper: true,
      },
      orderBy: { completedAt: "desc" },
      take: 5,
    });

    // Fetch achievements
    const achievements = await prisma.achievement.findMany({
      where: { userId },
    });

    const dateStr = getLocalDateString();
    let dailyGoalProgress = await prisma.dailyGoalProgress.findUnique({
      where: {
        userId_date: {
          userId,
          date: dateStr,
        },
      },
    });

    if (!dailyGoalProgress) {
      const lastProgress = await prisma.dailyGoalProgress.findFirst({
        where: { userId },
        orderBy: { date: "desc" },
      });

      const quantGoal = lastProgress?.quantGoal ?? 10;
      const varcGoal = lastProgress?.varcGoal ?? 6;
      const lrdiGoal = lastProgress?.lrdiGoal ?? 4;

      try {
        dailyGoalProgress = await prisma.dailyGoalProgress.create({
          data: {
            userId,
            date: dateStr,
            quantGoal,
            varcGoal,
            lrdiGoal,
            quantSolved: 0,
            varcSolved: 0,
            lrdiSolved: 0,
          },
        });
      } catch (err: any) {
        if (err.code === "P2002") {
          dailyGoalProgress = await prisma.dailyGoalProgress.findUnique({
            where: {
              userId_date: {
                userId,
                date: dateStr,
              },
            },
          });
        } else {
          throw err;
        }
      }
    }

    // Fetch all attempt answers for this user to calculate subtopic accuracies
    const attemptAnswers = await prisma.attemptAnswer.findMany({
      where: {
        attempt: {
          userId,
        },
      },
      select: {
        questionId: true,
        isCorrect: true,
        selectedOptionId: true,
        titaAnswer: true,
        timeSpentSeconds: true,
      },
      orderBy: { id: "desc" }
    });

    const uniqueQuestionIds = Array.from(new Set(attemptAnswers.map((ans) => ans.questionId)));

    const questions = await prisma.question.findMany({
      where: {
        id: {
          in: uniqueQuestionIds,
        },
      },
      include: {
        options: true,
        subtopic: {
          include: {
            topic: true
          }
        }
      }
    });

    const questionMap = new Map<string, any>();
    questions.forEach((q) => {
      questionMap.set(q.id, q);
    });

    // Group answers by subtopic and populate revision queue
    const subtopicStats: Record<string, { total: number; correct: number; totalTime: number }> = {};
    const revisionQueue: any[] = [];
    const seenRevQ = new Set<string>();

    attemptAnswers.forEach((ans) => {
      const q = questionMap.get(ans.questionId);
      if (!q || !q.subtopicId) return;
      
      const subId = q.subtopicId;
      if (!subtopicStats[subId]) {
        subtopicStats[subId] = { total: 0, correct: 0, totalTime: 0 };
      }
      subtopicStats[subId].total += 1;
      subtopicStats[subId].totalTime += (ans.timeSpentSeconds || 0);
      
      if (ans.isCorrect) {
        subtopicStats[subId].correct += 1;
      } else {
        // Add to revision queue if wrong or skipped, up to limit
        if (!seenRevQ.has(q.id) && revisionQueue.length < 50) {
          seenRevQ.add(q.id);
          revisionQueue.push({
            id: q.id,
            content: q.content,
            topic: q.subtopic?.topic?.name || "Unknown",
            category: q.subtopic?.topic?.category || "Unknown",
            userAnswer: ans.selectedOptionId 
              ? q.options.find((o: any) => o.id === ans.selectedOptionId)?.content 
              : ans.titaAnswer || "(Skipped)",
            correctAnswer: q.type === "MCQ"
              ? q.options.find((o: any) => o.isCorrect)?.content
              : q.answer
          });
        }
      }
    });

    // Determine all topic accuracies for performance page
    const allTopicAccuracies = progressRows
      .filter((row) => {
        const stats = subtopicStats[row.subtopicId];
        return stats && stats.total > 0;
      })
      .map((row) => {
        const stats = subtopicStats[row.subtopicId];
        const accuracy = Math.round((stats.correct / stats.total) * 100);
        const avgTime = Math.round(stats.totalTime / stats.total);
        return {
          subtopicId: row.subtopicId,
          name: row.subtopic.name,
          category: row.subtopic.topic.category,
          accuracy,
          avgTime,
          total: stats.total,
          correct: stats.correct,
        };
      })
      .sort((a, b) => b.accuracy - a.accuracy); // Highest to lowest

    // Determine weak areas: topicTestCompleted === true AND total >= 1 AND accuracy < 70
    const weakAreas = progressRows
      .filter((row) => {
        if (!row.topicTestCompleted) return false;
        const stats = subtopicStats[row.subtopicId];
        if (!stats || stats.total === 0) return false;
        const accuracy = Math.round((stats.correct / stats.total) * 100);
        return accuracy < 70;
      })
      .map((row) => {
        const stats = subtopicStats[row.subtopicId];
        const accuracy = Math.round((stats.correct / stats.total) * 100);
        return {
          subtopicId: row.subtopicId,
          name: row.subtopic.name,
          category: row.subtopic.topic.category,
          accuracy,
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy); // sort by lowest accuracy first

    // Determine revision pending topics: revisionDone === false AND (practiceCompleted OR topicTestCompleted)
    const revisionPending = progressRows
      .filter((row) => !row.revisionDone && (row.practiceQuestionsCompleted || row.topicTestCompleted))
      .map((row) => ({
        subtopicId: row.subtopicId,
        name: row.subtopic.name,
        category: row.subtopic.topic.category,
      }));

    // Precompute topic list captions per section (QUANT/VARC/LRDI)
    const allTopics = await prisma.topic.findMany({
      select: {
        name: true,
        category: true,
      },
    });

    const getCaptionForCategory = (category: string) => {
      const names = allTopics.filter((t) => t.category === category).map((t) => t.name);
      if (names.length === 0) return "";
      const firstThree = names.slice(0, 3);
      const remainingCount = names.length - firstThree.length;
      return remainingCount > 0
        ? `${firstThree.join(", ")} +${remainingCount} more`
        : firstThree.join(", ");
    };

    const sectionTopicCaptions = {
      QUANT: getCaptionForCategory("QUANT"),
      VARC: getCaptionForCategory("VARC"),
      LRDI: getCaptionForCategory("LRDI"),
    };

    return NextResponse.json({
      userName: user?.name,
      streak: user?.streak || 0,
      overallProgress,
      quantProgress,
      varcProgress,
      lrdiProgress,
      topicProgress,
      recentAttempts,
      achievements,
      rawProgress: progressRows,
      dailyGoalProgress,
      weakAreas,
      allTopicAccuracies,
      revisionPending,
      sectionTopicCaptions,
      revisionQueue,
      subtopicStats,
    });
  } catch (error: unknown) {
    console.error("GET user progress error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const userId = auth.userId;

    const body = await req.json();
    const { subtopicId, field, value, questionsAnswered } = body; // field = 'formulaSheetRead', etc.

    if (!subtopicId || !field) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Update progress row
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_subtopicId: {
          userId,
          subtopicId,
        },
      },
      update: {
        [field]: value,
      },
      create: {
        userId,
        subtopicId,
        [field]: value,
      },
    });

    // Update Daily solved targets on practice completion
    if (field === "practiceQuestionsCompleted" && value === true) {
      const subtopic = await prisma.subtopic.findUnique({
        where: { id: subtopicId },
        include: {
          topic: true
        }
      });
      const category = subtopic?.topic?.category;
      if (category) {
        const dateStr = getLocalDateString();
        const incrementValue = questionsAnswered ?? 10;
        await prisma.dailyGoalProgress.upsert({
          where: {
            userId_date: {
              userId,
              date: dateStr,
            },
          },
          update: {
            ...(category === "QUANT" && { quantSolved: { increment: incrementValue } }),
            ...(category === "VARC" && { varcSolved: { increment: incrementValue } }),
            ...(category === "LRDI" && { lrdiSolved: { increment: incrementValue } }),
          },
          create: {
            userId,
            date: dateStr,
            quantGoal: 10,
            varcGoal: 6,
            lrdiGoal: 4,
            quantSolved: category === "QUANT" ? incrementValue : 0,
            varcSolved: category === "VARC" ? incrementValue : 0,
            lrdiSolved: category === "LRDI" ? incrementValue : 0,
          },
        });
      }
    }

    // Trigger achievements check
    // 1. First topic completed check
    const progressRows = await prisma.userProgress.findMany({
      where: { userId },
    });
    
    const fullyCompletedTopics = progressRows.filter(
      r => r.formulaSheetRead && r.practiceQuestionsCompleted && r.topicTestCompleted && r.revisionDone
    );

    if (fullyCompletedTopics.length >= 1) {
      const existingAch = await prisma.achievement.findFirst({
        where: { userId, title: "First Topic Completed" }
      });
      if (!existingAch) {
        await prisma.achievement.create({
          data: {
            title: "First Topic Completed",
            description: "Successfully finished a formula sheet and practice questions for one topic.",
            userId
          }
        });
      }
    }

    return NextResponse.json({ success: true, progress });
  } catch (error: unknown) {
    console.error("POST user progress error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
