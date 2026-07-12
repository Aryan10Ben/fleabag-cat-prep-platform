import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        catPyqPaper: true,
        sectionScores: true,
        answers: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!attempt || !attempt.catPyqPaperId) {
      return NextResponse.json({ error: "PYQ attempt not found" }, { status: 404 });
    }

    const paper = await prisma.catPyqPaper.findUnique({
      where: { id: attempt.catPyqPaperId },
      include: {
        sections: {
          orderBy: { orderIndex: "asc" },
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: {
                question: {
                  include: { options: true, rcPassage: true, lrdiSet: true },
                },
              },
            },
          },
        },
      },
    });

    if (!paper) return NextResponse.json({ error: "Paper not found" }, { status: 404 });

    const questions = paper.sections.flatMap((sec) =>
      sec.questions.map((pq) => {
        const ans = attempt.answers.find((a) => a.questionId === pq.questionId);
        return {
          ...pq.question,
          section: sec.section,
          order: pq.order,
          selectedOptionId: ans?.selectedOptionId,
          titaAnswer: ans?.titaAnswer,
          isCorrect: ans?.isCorrect ?? false,
          isMarkedReview: ans?.isMarkedReview ?? false,
          timeSpentSeconds: ans?.timeSpentSeconds ?? 0,
          visited: ans?.visited ?? false,
        };
      })
    );

    return NextResponse.json({
      attempt: {
        ...attempt,
        test: null,
        paper: attempt.catPyqPaper,
      },
      questions,
      sectionScores: attempt.sectionScores,
    });
  } catch (error: unknown) {
    console.error("GET PYQ analysis error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
