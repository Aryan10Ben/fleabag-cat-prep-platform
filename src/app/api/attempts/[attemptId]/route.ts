import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
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
        test: true,
        answers: {
          include: {
            attempt: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (!attempt.testId) {
      return NextResponse.json({ error: "Use /api/pyq/analysis for PYQ attempts" }, { status: 400 });
    }

    const testQuestions = await prisma.testQuestion.findMany({
      where: { testId: attempt.testId },
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
    });

    const questionsWithAnswers = testQuestions.map((tq) => {
      const q = tq.question;
      const ans = attempt.answers.find((a) => a.questionId === q.id);
      return {
        ...q,
        selectedOptionId: ans?.selectedOptionId,
        titaAnswer: ans?.titaAnswer,
        isCorrect: ans?.isCorrect || false,
        isMarkedReview: ans?.isMarkedReview || false,
      };
    });

    return NextResponse.json({
      attempt,
      questions: questionsWithAnswers,
    });
  } catch (error: unknown) {
    console.error("GET attempt detail error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
