import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";
import { sendPushToUser } from "@/lib/push";
import { fullName } from "@/lib/friends";

type Params = { params: Promise<{ userId: string }> };

/** Follow someone. Following back makes you friends. Idempotent. */
export async function POST(_request: Request, { params }: Params) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Log in to follow people" }, { status: 401 });
  const { userId } = await params;
  if (userId === me.id) return NextResponse.json({ error: "You can't follow yourself" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Person not found" }, { status: 404 });

  const existing = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: me.id, followingId: userId } } });
  if (!existing) {
    await prisma.follow.create({ data: { followerId: me.id, followingId: userId } });
    const followsBack = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: userId, followingId: me.id } } });
    after(async () => {
      await sendPushToUser(userId, {
        category: "FRIENDS",
        title: followsBack ? "You're now friends" : "New follower",
        body: followsBack ? `You and ${fullName(me)} follow each other.` : `${fullName(me)} started following you.`,
        url: "/home?friends=1",
      }).catch(() => undefined);
    });
  }
  return NextResponse.json({ following: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Log in first" }, { status: 401 });
  const { userId } = await params;
  await prisma.follow.deleteMany({ where: { followerId: me.id, followingId: userId } });
  return NextResponse.json({ following: false });
}
