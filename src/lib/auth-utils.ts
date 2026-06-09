import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

export type AuthResult =
  | { ok: true; userId: string; role: string }
  | { ok: false; response: NextResponse };

export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return {
    ok: true,
    userId: session.user.id,
    role: session.user.role ?? "USER",
  };
}

export async function requireAdmin(): Promise<AuthResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;
  if (auth.role !== "ADMIN") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 }),
    };
  }
  return auth;
}
