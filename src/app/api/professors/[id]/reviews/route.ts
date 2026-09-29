import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { professorReviewSchema } from "@/lib/professor-validation";
import { awardPoints } from "@/lib/points";

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

  const { gradingRating, funRating, teachingRating, comment, courseId } = parsed.data;

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
      funRating,
      teachingRating,
      comment: comment || null,
    },
    select: {
      id: true,
      gradingRating: true,
      funRating: true,
      teachingRating: true,
      comment: true,
      createdAt: true,
      course: { select: { id: true, code: true, title: true } },
    },
  });
  await awardPoints(user.id, "PROF_RATE", review.id);
  if (comment) await awardPoints(user.id, "PROF_COMMENT", review.id);

  // Ratings are anonymous — the author's identity never goes over the wire,
  // only this "it's mine" flag so the submitter sees their own edit/delete controls.
  return NextResponse.json({ review: { ...review, isOwn: true } }, { status: 201 });
}
