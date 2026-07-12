import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserId } from "@/lib/pyq/auth";
import { SECTION_META } from "@/lib/pyq/constants";

export async function POST(req: NextRequest) {
  try {
    const userId = await resolveUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { paperId } = await req.json();
    if (!paperId) return NextResponse.json({ error: "paperId required" }, { status: 400 });

    const paper = await prisma.catPyqPaper.findUnique({ where: { id: paperId } });
    if (!paper) return NextResponse.json({ error: "Paper not found" }, { status: 404 });

    const defaultTimers = {
      VARC: SECTION_META.VARC.duration * 60,
      DILR: SECTION_META.DILR.duration * 60,
      QA: SECTION_META.QA.duration * 60,
    };

    const session = await prisma.examSession.upsert({
      where: { userId_paperId: { userId, paperId } },
      create: {
        userId,
        paperId,
        currentSection: "VARC",
        sectionIndex: 0,
        sectionTimersJson: JSON.stringify(defaultTimers),
        answersJson: "{}",
        questionTimesJson: "{}",
      },
      update: {},
    });

    if (session.completed) {
      await prisma.examSession.update({
        where: { id: session.id },
        data: {
          completed: false,
          currentSection: "VARC",
          sectionIndex: 0,
          sectionTimersJson: JSON.stringify(defaultTimers),
          answersJson: "{}",
          questionTimesJson: "{}",
          startedAt: new Date(),
        },
      });
    }

    const fresh = await prisma.examSession.findUnique({ where: { id: session.id } });

    return NextResponse.json({ session: fresh });
  } catch (error: unknown) {
    console.error("Create/Fetch exam session error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
