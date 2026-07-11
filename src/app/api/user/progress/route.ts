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
    const progressRows = await prisma.userProgress.findMany({
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
      await prisma.userProgress.createMany({
        data: allSubtopics.map((sub) => ({
          userId,
          subtopicId: sub.id,
          formulaSheetRead: Math.random() > 0.6,
          practiceQuestionsCompleted: Math.random() > 0.6,
          topicTestCompleted: Math.random() > 0.7,
          revisionDone: Math.random() > 0.8,
        })),
      });

      // Re-fetch
      return GET(req);
    }

    // Calculate percentages
    const totalItems = progressRows.length * 4;
    let completedItems = 0;

    let quantTotal = 0;
    let quantCompleted = 0;

    let varcTotal = 0;
    let varcCompleted = 0;

    let lrdiTotal = 0;
    let lrdiCompleted = 0;

    const topicProgress: Record<string, { total: number; completed: number }> = {};

    progressRows.forEach((row) => {
      const subtopic = row.subtopic;
      const category = subtopic.topic.category; // QUANT, VARC, LRDI
      
      const count =
        (row.formulaSheetRead ? 1 : 0) +
        (row.practiceQuestionsCompleted ? 1 : 0) +
        (row.topicTestCompleted ? 1 : 0) +
        (row.revisionDone ? 1 : 0);

      completedItems += count;

      if (category === "QUANT") {
        quantTotal += 4;
        quantCompleted += count;
      } else if (category === "VARC") {
        varcTotal += 4;
        varcCompleted += count;
      } else if (category === "LRDI") {
        lrdiTotal += 4;
        lrdiCompleted += count;
      }

      // Track subtopic stats
      topicProgress[subtopic.name] = {
        total: 4,
        completed: count,
      };
    });

    const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    const quantProgress = quantTotal > 0 ? Math.round((quantCompleted / quantTotal) * 100) : 0;
    const varcProgress = varcTotal > 0 ? Math.round((varcCompleted / varcTotal) * 100) : 0;
    const lrdiProgress = lrdiTotal > 0 ? Math.round((lrdiCompleted / lrdiTotal) * 100) : 0;

    // Fetch recent attempts
    const recentAttempts = await prisma.attempt.findMany({
      where: { userId },
      include: { test: true },
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
    });
  } catch (error: unknown) {
    console.error("GET user progress error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const userId = auth.userId;

    const body = await req.json();
    const { subtopicId, field, value } = body; // field = 'formulaSheetRead', etc.

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
        await prisma.dailyGoalProgress.upsert({
          where: {
            userId_date: {
              userId,
              date: dateStr,
            },
          },
          update: {
            ...(category === "QUANT" && { quantSolved: { increment: 10 } }),
            ...(category === "VARC" && { varcSolved: { increment: 10 } }),
            ...(category === "LRDI" && { lrdiSolved: { increment: 10 } }),
          },
          create: {
            userId,
            date: dateStr,
            quantGoal: 10,
            varcGoal: 6,
            lrdiGoal: 4,
            quantSolved: category === "QUANT" ? 10 : 0,
            varcSolved: category === "VARC" ? 10 : 0,
            lrdiSolved: category === "LRDI" ? 10 : 0,
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
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
