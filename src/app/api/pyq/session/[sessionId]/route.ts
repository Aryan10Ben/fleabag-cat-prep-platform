import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserId } from "@/lib/pyq/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const userId = await resolveUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sessionId } = await params;
    const body = await req.json();

    const session = await prisma.examSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const updated = await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        currentSection: body.currentSection ?? session.currentSection,
        sectionIndex: body.sectionIndex ?? session.sectionIndex,
        sectionTimersJson: body.sectionTimers
          ? JSON.stringify(body.sectionTimers)
          : session.sectionTimersJson,
        answersJson: body.answers ? JSON.stringify(body.answers) : session.answersJson,
        questionTimesJson: body.questionTimes
          ? JSON.stringify(body.questionTimes)
          : session.questionTimesJson,
      },
    });

    return NextResponse.json({ session: updated });
  } catch (error: unknown) {
    console.error("Update exam session error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
