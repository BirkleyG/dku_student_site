import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const voteSchema = z.object({ value: z.union([z.literal(1), z.literal(-1)]) });

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to vote" }, { status: 401 });
  }

  const { id: postId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.wisdomVote.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
  });

  if (existing && existing.value === parsed.data.value) {
    await prisma.wisdomVote.delete({ where: { id: existing.id } });
  } else if (existing) {
    await prisma.wisdomVote.update({ where: { id: existing.id }, data: { value: parsed.data.value } });
  } else {
    await prisma.wisdomVote.create({ data: { postId, userId: user.id, value: parsed.data.value } });
  }

  const votes = await prisma.wisdomVote.findMany({ where: { postId } });
  const score = votes.reduce((sum, v) => sum + v.value, 0);
  const myVote = votes.find((v) => v.userId === user.id)?.value ?? 0;

  return NextResponse.json({ score, myVote });
}
