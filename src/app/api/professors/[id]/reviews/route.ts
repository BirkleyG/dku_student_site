import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { professorReviewSchema } from "@/lib/professor-validation";
import { awardPoints } from "@/lib/community-score";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to rate a professor" }, { status: 401 });
  }

  const { id: professorId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = professorReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const [user, professor] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.professor.findUnique({ where: { id: professorId } }),
  ]);
  if (!user || !professor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { gradingRating, difficultyRating, teachingRating, comment, courseId } = parsed.data;

  const existing = await prisma.professorReview.findFirst({
    where: { professorId, authorId: user.id, courseId: courseId || null },
  });
  if (existing) {
    return NextResponse.json({ error: "You've already rated this professor for that course" }, { status: 409 });
  }

  const review = await prisma.professorReview.create({
    data: {
      professorId,
      authorId: user.id,
      courseId: courseId || null,
      gradingRating,
      difficultyRating,
      teachingRating,
      comment: comment || null,
    },
    include: { author: { select: { firstName: true, lastName: true } }, course: { select: { code: true, title: true } } },
  });
  await awardPoints(user.id, "PROFESSOR_REVIEW");

  return NextResponse.json({ review }, { status: 201 });
}
