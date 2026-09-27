import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dearDkuCommentSchema } from "@/lib/dear-dku-validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to leave feedback" }, { status: 401 });
  }

  const { id: postId } = await params;
  const post = await prisma.dearDkuPost.findUnique({ where: { id: postId } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = dearDkuCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comment = await prisma.dearDkuComment.create({
    data: { postId, body: parsed.data.body, authorId: user.id },
    include: { author: { select: { firstName: true, lastName: true } } },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
