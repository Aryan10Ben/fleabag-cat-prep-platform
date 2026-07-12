import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tests = await prisma.test.findMany({
      orderBy: { id: "desc" },
      include: {
        questions: { select: { id: true } },
      },
    });

    return NextResponse.json({ tests });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tests" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, category, duration } = body;

    const test = await prisma.test.create({
      data: {
        name,
        type,
        category,
        duration: parseInt(duration),
      },
    });

    return NextResponse.json({ test });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create test" }, { status: 500 });
  }
}
