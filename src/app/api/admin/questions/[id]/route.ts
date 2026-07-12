import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, type, difficulty, subtopicId, solution, options } = body;

    // Update the question
    const updatedQuestion = await prisma.question.update({
      where: { id: id },
      data: {
        content,
        type,
        difficulty,
        subtopicId,
        solution,
      },
    });

    // If it's an MCQ, update the options
    if (type === "MCQ" && options && Array.isArray(options)) {
      // For simplicity, delete existing options and recreate them
      await prisma.option.deleteMany({
        where: { questionId: id },
      });
      await prisma.option.createMany({
        data: options.map((opt: any) => ({
          content: opt.content,
          isCorrect: opt.isCorrect,
          questionId: id,
        })),
      });
    } else if (type === "TITA") {
      // If changed to TITA, remove options
      await prisma.option.deleteMany({
        where: { questionId: id },
      });
    }

    return NextResponse.json({ success: true, question: updatedQuestion });
  } catch (error) {
    console.error("Update question error:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.question.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete question error:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
