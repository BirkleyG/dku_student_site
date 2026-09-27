import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";

type Params = { params: Promise<{ id: string; commentId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { commentId } = await params;
  const [user, comment] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.dearDkuComment.findUnique({ where: { id: commentId } }),
  ]);

  if (!user || !comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (comment.authorId !== user.id && !hasScope(user, "DEARDKU")) {
    return NextResponse.json({ error: "You can't remove this comment" }, { status: 403 });
  }

  await prisma.dearDkuComment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
