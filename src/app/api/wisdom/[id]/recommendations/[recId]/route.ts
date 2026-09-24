import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";

type Params = { params: Promise<{ id: string; recId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { recId } = await params;
  const [user, recommendation] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.wisdomRecommendation.findUnique({ where: { id: recId } }),
  ]);

  if (!user || !recommendation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (recommendation.authorId !== user.id && !hasScope(user, "WISDOM")) {
    return NextResponse.json({ error: "You can't remove this recommendation" }, { status: 403 });
  }

  await prisma.wisdomRecommendation.delete({ where: { id: recId } });
  return NextResponse.json({ ok: true });
}
