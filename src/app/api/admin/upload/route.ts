import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { getErrorMessage } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { BulkQuestionInput, QuestionOptionInput } from "@/types/api";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();

    if (body.bulk && Array.isArray(body.questions)) {
      const createdQuestions = [];
      for (const q of body.questions as BulkQuestionInput[]) {
        const { content, options, solution, subtopicName, difficulty, type } = q;

        let subtopic = await prisma.subtopic.findFirst({
          where: { name: subtopicName },
        });

        if (!subtopic) {
          subtopic = await prisma.subtopic.findFirst();
        }

        const created = await prisma.question.create({
          data: {
            content,
            type: type || "MCQ",
            difficulty: difficulty || "MEDIUM",
            subtopicId: subtopic?.id || null,
            solution,
            options: {
              create: options.map((opt: QuestionOptionInput) => ({
                content: opt.content,
                isCorrect: opt.isCorrect,
              })),
            },
          },
        });
        createdQuestions.push(created);
      }

      return NextResponse.json({ success: true, count: createdQuestions.length });
    }

    const { content, options, solution, subtopicId, difficulty, type } = body;

    if (!content || !solution || !subtopicId || !difficulty) {
      return NextResponse.json({ error: "Missing required question parameters" }, { status: 400 });
    }

    const createdQuestion = await prisma.question.create({
      data: {
        content,
        type: type || "MCQ",
        difficulty,
        subtopicId,
        solution,
        options: {
          create: (options as QuestionOptionInput[]).map((opt) => ({
            content: opt.content,
            isCorrect: opt.isCorrect,
          })),
        },
      },
      include: {
        options: true,
      },
    });

    return NextResponse.json({ success: true, question: createdQuestion });
  } catch (error: unknown) {
    console.error("Upload question error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
