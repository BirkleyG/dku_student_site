import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const post = await prisma.newsPost.findUnique({
    where: { id },
    include: { author: { select: { firstName: true, lastName: true } } },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || !hasScope(user, "NEWS")) {
    return NextResponse.json({ error: "You don't have News admin permission" }, { status: 403 });
  }

  const { id } = await params;
  const post = await prisma.newsPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.newsPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
