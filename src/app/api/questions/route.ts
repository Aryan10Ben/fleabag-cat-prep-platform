import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subtopicId = searchParams.get("subtopicId");
    const testId = searchParams.get("testId");
    const difficulty = searchParams.get("difficulty");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 100;

    if (testId) {
      const testQuestions = await prisma.testQuestion.findMany({
        where: { testId },
        include: {
          question: {
            include: {
              options: true,
              rcPassage: true,
              lrdiSet: true,
              subtopic: {
                include: {
                  topic: true,
                }
              }
            },
          },
        },
        orderBy: { order: "asc" },
      });

      const questions = testQuestions.map((tq) => tq.question);
      return NextResponse.json({ questions });
    }

    if (subtopicId) {
      const where: { subtopicId: string; difficulty?: string } = { subtopicId };
      if (difficulty && ["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
        where.difficulty = difficulty;
      }

      const questions = await prisma.question.findMany({
        where,
        include: {
          options: true,
          rcPassage: true,
          lrdiSet: true,
        },
        orderBy: { id: "asc" },
        take: Math.min(limit, 100),
      });

      return NextResponse.json({ questions, total: questions.length });
    }

    const questions = await prisma.question.findMany({
      include: {
        options: true,
      },
      take: limit,
    });

    return NextResponse.json({ questions });
  } catch (error: unknown) {
    console.error("GET questions error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
