import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ paperId: string }> }
) {
  try {
    const { paperId } = await params;

    const paper = await prisma.catPyqPaper.findUnique({
      where: { id: paperId },
      include: {
        sections: {
          orderBy: { orderIndex: "asc" },
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: {
                question: {
                  include: {
                    options: true,
                    rcPassage: true,
                    lrdiSet: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const sections = paper.sections.map((sec) => ({
      id: sec.id,
      section: sec.section,
      duration: sec.duration,
      orderIndex: sec.orderIndex,
      questions: sec.questions.map((pq) => ({
        order: pq.order,
        setGroupId: pq.setGroupId,
        ...pq.question,
      })),
    }));

    return NextResponse.json({
      paper: {
        id: paper.id,
        year: paper.year,
        slot: paper.slot,
        title: paper.title,
        status: paper.status,
        totalDuration: 120,
        sections,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
