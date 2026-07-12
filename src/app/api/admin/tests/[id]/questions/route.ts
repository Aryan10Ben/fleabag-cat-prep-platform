import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { questionId } = await request.json();

    // Get current max order
    const maxOrder = await prisma.testQuestion.findFirst({
      where: { testId: id },
      orderBy: { order: "desc" },
    });

    const newOrder = maxOrder ? maxOrder.order + 1 : 1;

    const tq = await prisma.testQuestion.create({
      data: {
        testId: id,
        questionId,
        order: newOrder,
      },
    });

    return NextResponse.json({ success: true, testQuestion: tq });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add question" }, { status: 500 });
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

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
    }

    await prisma.testQuestion.deleteMany({
      where: {
        testId: id,
        questionId: questionId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove question" }, { status: 500 });
  }
}
