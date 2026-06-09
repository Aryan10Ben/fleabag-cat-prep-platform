import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { getErrorMessage } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: { name: name.trim() },
    });

    return NextResponse.json({ success: true, userName: updatedUser.name });
  } catch (error: unknown) {
    console.error("POST user profile error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
