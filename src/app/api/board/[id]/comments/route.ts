import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { boardCommentSchema } from "@/lib/board-validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to comment" }, { status: 401 });
  }
  if (!session.user.verified) {
    return NextResponse.json({ error: "Verify your DKU email before commenting" }, { status: 403 });
  }

  const { id: postId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = boardCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const [user, post] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.boardPost.findUnique({ where: { id: postId } }),
  ]);
  if (!user || !post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comment = await prisma.boardComment.create({
    data: { postId, authorId: user.id, body: parsed.data.body },
    include: { author: { select: { firstName: true, lastName: true } } },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
