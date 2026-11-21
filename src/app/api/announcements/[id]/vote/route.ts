import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";
import { announcementVoteSchema } from "@/lib/announcement-validation";
import { expiresAt, isVisible, tally } from "@/lib/announcement-rank";

type Params = { params: Promise<{ id: string }> };

/** Toggle vote: same value again removes it. Returns the fresh tally and new expiry. */
export async function POST(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Log in to vote" }, { status: 401 });

  const { id: announcementId } = await params;
  const parsed = announcementVoteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid vote" }, { status: 400 });

  const announcement = await prisma.announcement.findUnique({ where: { id: announcementId }, select: { createdAt: true } });
  if (!announcement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const key = { announcementId_userId: { announcementId, userId: user.id } };
  const existing = await prisma.announcementVote.findUnique({ where: key });
  if (existing && existing.value === parsed.data.value) {
    await prisma.announcementVote.delete({ where: key });
  } else if (existing) {
    await prisma.announcementVote.update({ where: key, data: { value: parsed.data.value } });
  } else {
    await prisma.announcementVote.create({ data: { announcementId, userId: user.id, value: parsed.data.value } });
  }

  const votes = await prisma.announcementVote.findMany({ where: { announcementId }, select: { userId: true, value: true } });
  const t = tally(votes);
  const input = { createdAt: announcement.createdAt, ...t };
  return NextResponse.json({
    up: t.up,
    down: t.down,
    myVote: votes.find((v) => v.userId === user.id)?.value ?? 0,
    expiresAt: expiresAt(input).toISOString(),
    visible: isVisible(input, new Date()),
  });
}
