import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";

const MIN_GAP_MS = 30_000;

/** Heartbeat from the app shell while a tab is open and visible. Skipped entirely for people who hide their status. */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!user.showOnlineStatus) return NextResponse.json({ ok: true, tracked: false });
  const now = new Date();
  // A cheap guard so a few open tabs don't each write every minute.
  await prisma.user.updateMany({
    where: { id: user.id, OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: new Date(now.getTime() - MIN_GAP_MS) } }] },
    data: { lastSeenAt: now },
  });
  return NextResponse.json({ ok: true, tracked: true });
}
