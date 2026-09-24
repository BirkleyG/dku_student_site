import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";

type Params = { params: Promise<{ id: string; reviewId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { reviewId } = await params;
  const [user, review] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.professorReview.findUnique({ where: { id: reviewId } }),
  ]);

  if (!user || !review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (review.authorId !== user.id && !hasScope(user, "PROFESSORS")) {
    return NextResponse.json({ error: "You can't remove this rating" }, { status: 403 });
  }

  await prisma.professorReview.delete({ where: { id: reviewId } });
  return NextResponse.json({ ok: true });
}
