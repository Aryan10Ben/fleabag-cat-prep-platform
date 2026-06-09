import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserId } from "@/lib/pyq/auth";

export async function GET() {
  try {
    const userId = await resolveUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const analytics = await prisma.userAnalytics.findUnique({ where: { userId } });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true, name: true },
    });

    const pyqAttempts = await prisma.attempt.count({
      where: { userId, catPyqPaperId: { not: null } },
    });

    return NextResponse.json({
      analytics: analytics ?? {
        testsTaken: 0,
        pyqMocksTaken: pyqAttempts,
        bestScore: 0,
        averageScore: 0,
        bestPercentile: 0,
        averagePercentile: 0,
        strongestSection: null,
        weakestSection: null,
        weeklyProgressJson: "[]",
        monthlyProgressJson: "[]",
      },
      streak: user?.streak ?? 0,
      mocksAttempted: (analytics?.testsTaken ?? 0) + pyqAttempts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
