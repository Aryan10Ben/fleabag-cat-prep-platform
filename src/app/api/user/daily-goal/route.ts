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

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const dateStr = getLocalDateString();

    let dailyProgress = await prisma.dailyGoalProgress.findUnique({
      where: {
        userId_date: {
          userId: auth.userId,
          date: dateStr,
        },
      },
    });

    if (!dailyProgress) {
      const lastProgress = await prisma.dailyGoalProgress.findFirst({
        where: { userId: auth.userId },
        orderBy: { date: "desc" },
      });

      const quantGoal = lastProgress?.quantGoal ?? 10;
      const varcGoal = lastProgress?.varcGoal ?? 6;
      const lrdiGoal = lastProgress?.lrdiGoal ?? 4;

      try {
        dailyProgress = await prisma.dailyGoalProgress.create({
          data: {
            userId: auth.userId,
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
          dailyProgress = await prisma.dailyGoalProgress.findUnique({
            where: {
              userId_date: {
                userId: auth.userId,
                date: dateStr,
              },
            },
          });
        } else {
          throw err;
        }
      }
    }

    return NextResponse.json(dailyProgress);
  } catch (error: unknown) {
    console.error("GET daily goal error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    let { quantGoal, varcGoal, lrdiGoal } = body;

    if (quantGoal !== undefined) {
      quantGoal = Math.max(5, Math.min(100, Math.round(Number(quantGoal) / 5) * 5));
    }
    if (varcGoal !== undefined) {
      varcGoal = Math.max(2, Math.min(100, Math.round(Number(varcGoal) / 2) * 2));
    }
    if (lrdiGoal !== undefined) {
      lrdiGoal = Math.max(1, Math.min(100, Math.round(Number(lrdiGoal) / 1) * 1));
    }

    const dateStr = getLocalDateString();

    const dailyProgress = await prisma.dailyGoalProgress.upsert({
      where: {
        userId_date: {
          userId: auth.userId,
          date: dateStr,
        },
      },
      update: {
        ...(quantGoal !== undefined && { quantGoal }),
        ...(varcGoal !== undefined && { varcGoal }),
        ...(lrdiGoal !== undefined && { lrdiGoal }),
      },
      create: {
        userId: auth.userId,
        date: dateStr,
        quantGoal: quantGoal ?? 10,
        varcGoal: varcGoal ?? 6,
        lrdiGoal: lrdiGoal ?? 4,
        quantSolved: 0,
        varcSolved: 0,
        lrdiSolved: 0,
      },
    });

    return NextResponse.json({ success: true, dailyProgress });
  } catch (error: unknown) {
    console.error("POST daily goal error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
