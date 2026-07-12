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

    const papers = await prisma.catPyqPaper.findMany({
      orderBy: [{ year: "desc" }, { slot: "asc" }],
      include: {
        sections: {
          include: {
            questions: { select: { id: true } },
          },
        },
      },
    });

    return NextResponse.json({ papers });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch PYQs" }, { status: 500 });
  }
}
