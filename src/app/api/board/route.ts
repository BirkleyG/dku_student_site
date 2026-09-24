import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { boardPostSchema } from "@/lib/board-validation";
import { awardPoints } from "@/lib/community-score";

export async function GET() {
  const posts = await prisma.boardPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { firstName: true, lastName: true } }, _count: { select: { comments: true } } },
  });
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to post" }, { status: 401 });
  }
  if (!session.user.verified) {
    return NextResponse.json({ error: "Verify your DKU email before posting" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = boardPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const post = await prisma.boardPost.create({
    data: { title: parsed.data.title, body: parsed.data.body, authorId: user.id },
  });
  await awardPoints(user.id, "BOARD_POST");

  return NextResponse.json({ post }, { status: 201 });
}
