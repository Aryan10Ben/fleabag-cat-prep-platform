import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { getErrorMessage } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json({ error: "Missing category parameter" }, { status: 400 });
    }

    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const topics = await prisma.topic.findMany({
      where: { category },
      include: {
        subtopics: {
          include: {
            questions: {
              select: { id: true },
            },
            formulaSheets: {
              select: { id: true, title: true, content: true },
            },
          },
        },
      },
    });

    const userProgress = await prisma.userProgress.findMany({
      where: { userId: auth.userId },
    });

    return NextResponse.json({
      topics,
      userProgress,
    });
  } catch (error: unknown) {
    console.error("GET topics error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
