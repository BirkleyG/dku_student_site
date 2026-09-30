import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** The signed-in user's row, or null. For API routes that only need "who is calling". */
export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}
