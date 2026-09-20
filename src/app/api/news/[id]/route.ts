import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  if (!session?.user?.email || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can remove articles" }, { status: 403 });
  }

  const { id } = await params;
  const post = await prisma.newsPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.newsPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
