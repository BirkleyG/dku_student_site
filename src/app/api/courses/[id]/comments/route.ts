import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { courseCommentSchema } from "@/lib/course-validation";
import { awardPoints } from "@/lib/community-score";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to comment" }, { status: 401 });
  }

  const { id: courseId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = courseCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const [user, course] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.course.findUnique({ where: { id: courseId } }),
  ]);
  if (!user || !course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comment = await prisma.courseComment.create({
    data: { courseId, authorId: user.id, body: parsed.data.body },
    include: { author: { select: { firstName: true, lastName: true } } },
  });
  await awardPoints(user.id, "COURSE_COMMENT");

  return NextResponse.json({ comment }, { status: 201 });
}
