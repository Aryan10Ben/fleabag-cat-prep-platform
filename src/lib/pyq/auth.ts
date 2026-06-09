import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function resolveUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return session.user.id;
  return null;
}
