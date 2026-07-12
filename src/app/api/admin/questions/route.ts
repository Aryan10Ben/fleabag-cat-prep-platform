import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search");

    const where: any = {};
    if (category) {
      where.subtopic = {
        topic: {
          category: category,
        },
      };
    }
    if (difficulty) {
      where.difficulty = difficulty;
    }
    if (search) {
      where.content = { contains: search };
    }

    const questions = await prisma.question.findMany({
      where,
      orderBy: { id: "desc" },
      take: 100, // Limit to 100 for MVP
      include: {
        options: true,
        subtopic: {
          include: {
            topic: true,
          },
        },
      },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Fetch admin questions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
