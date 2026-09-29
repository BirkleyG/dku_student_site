import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";

type Params = { params: Promise<{ id: string; recId: string }> };

const voteSchema = z.object({ value: z.union([z.literal(1), z.literal(-1)]) });

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to vote" }, { status: 401 });
  }

  const { recId: recommendationId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.wisdomVote.findUnique({
    where: { recommendationId_userId: { recommendationId, userId: user.id } },
  });

  if (existing && existing.value === parsed.data.value) {
    await prisma.wisdomVote.delete({ where: { id: existing.id } });
  } else if (existing) {
    await prisma.wisdomVote.update({ where: { id: existing.id }, data: { value: parsed.data.value } });
  } else {
    await prisma.wisdomVote.create({ data: { recommendationId, userId: user.id, value: parsed.data.value } });
  }

  // Points are keyed on (user, recommendation), so un-voting and re-voting can't pay twice.
  // Voting on your own recommendation doesn't count.
  const rec = await prisma.wisdomRecommendation.findUnique({ where: { id: recommendationId }, select: { authorId: true } });
  if (rec && rec.authorId !== user.id) await awardPoints(user.id, "WISDOM_VOTE", recommendationId);

  const votes = await prisma.wisdomVote.findMany({ where: { recommendationId } });
  const score = votes.reduce((sum, v) => sum + v.value, 0);
  const myVote = votes.find((v) => v.userId === user.id)?.value ?? 0;

  return NextResponse.json({ score, myVote });
}
