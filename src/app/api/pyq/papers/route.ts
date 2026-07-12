import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserId } from "@/lib/pyq/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const slot = searchParams.get("slot");
    const difficulty = searchParams.get("difficulty");
    const section = searchParams.get("section");
    const completed = searchParams.get("completed");
    const search = searchParams.get("search")?.toLowerCase();
    const status = searchParams.get("status") || "PUBLISHED";

    const userId = await resolveUserId();

    const where: Record<string, unknown> = { status };
    if (year) where.year = parseInt(year);
    if (slot) where.slot = parseInt(slot);

    const papers = await prisma.catPyqPaper.findMany({
      where,
      include: {
        sections: {
          include: { _count: { select: { questions: true } } },
          orderBy: { orderIndex: "asc" },
        },
        attempts: userId
          ? { where: { userId }, select: { id: true, score: true, percentile: true, completedAt: true } }
          : false,
      },
      orderBy: [{ year: "desc" }, { slot: "asc" }],
    });

    let result = papers.map((p) => {
      const totalQuestions = p.sections.reduce((s, sec) => s + sec._count.questions, 0);
      const userAttempt = userId && Array.isArray(p.attempts) ? p.attempts[0] : null;
      return {
        id: p.id,
        year: p.year,
        slot: p.slot,
        title: p.title,
        status: p.status,
        totalQuestions,
        totalDuration: 120,
        sections: p.sections.map((s) => ({
          section: s.section,
          duration: s.duration,
          questionCount: s._count.questions,
        })),
        completed: !!userAttempt,
        lastAttempt: userAttempt
          ? {
              id: userAttempt.id,
              score: userAttempt.score,
              percentile: userAttempt.percentile,
              completedAt: userAttempt.completedAt,
            }
          : null,
      };
    });

    if (search) {
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          String(p.year).includes(search) ||
          `slot ${p.slot}`.includes(search)
      );
    }

    if (completed === "true") result = result.filter((p) => p.completed);
    if (completed === "false") result = result.filter((p) => !p.completed);

    if (section || difficulty) {
      // Filter metadata only — full filter applied client-side on section tags
    }

    return NextResponse.json({ papers: result });
  } catch (error: unknown) {
    console.error("GET PYQ papers error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
