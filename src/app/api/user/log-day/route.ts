import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

function getLocalDateString() {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60 * 1000;
  const istTime = new Date(utc + 3600000 * 5.5);
  return istTime.toISOString().split("T")[0];
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const userId = auth.userId;

    const dateStr = getLocalDateString();

    // Increment user streak
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        streak: { increment: 1 },
      },
    });

    // Fulfill daily goal
    await prisma.dailyGoalProgress.upsert({
      where: {
        userId_date: {
          userId,
          date: dateStr,
        },
      },
      update: {
        quantSolved: 10,
        varcSolved: 6,
        lrdiSolved: 4,
      },
      create: {
        userId,
        date: dateStr,
        quantGoal: 10,
        varcGoal: 6,
        lrdiGoal: 4,
        quantSolved: 10,
        varcSolved: 6,
        lrdiSolved: 4,
      },
    });

    return NextResponse.json({ success: true, newStreak: user.streak });
  } catch (error: unknown) {
    console.error("POST user log-day error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
