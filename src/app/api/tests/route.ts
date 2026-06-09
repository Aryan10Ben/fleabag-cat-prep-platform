import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const subtopicId = searchParams.get("subtopicId");
    const domain = searchParams.get("domain");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (subtopicId) where.id = { startsWith: `t-sub-${subtopicId}-` };
    if (domain) where.id = { startsWith: `t-dom-${domain.replace(/\s+/g, "")}-` };

    const tests = await prisma.test.findMany({
      where,
      include: {
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ tests });
  } catch (error: unknown) {
    console.error("GET tests error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
