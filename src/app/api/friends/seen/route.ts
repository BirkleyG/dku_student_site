import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";

/** Called when the Friends panel's Updates tab is opened: clears the unseen badge. */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Log in first" }, { status: 401 });
  await prisma.user.update({ where: { id: user.id }, data: { friendsSeenAt: new Date() } });
  return NextResponse.json({ ok: true });
}
