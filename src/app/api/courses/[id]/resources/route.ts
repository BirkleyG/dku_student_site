import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { courseResourceSchema } from "@/lib/course-validation";
import { awardPoints } from "@/lib/community-score";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to share a resource" }, { status: 401 });
  }
  if (!session.user.verified) {
    return NextResponse.json({ error: "Verify your DKU email before sharing" }, { status: 403 });
  }

  const { id: courseId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = courseResourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const [user, course] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.course.findUnique({ where: { id: courseId } }),
  ]);
  if (!user || !course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { type, title, semester, body: text, fileUrl } = parsed.data;
  if (!text && !fileUrl) {
    return NextResponse.json({ error: "Add a note, or a link to the file" }, { status: 400 });
  }

  const resource = await prisma.courseResource.create({
    data: {
      courseId,
      type,
      title,
      semester: semester || null,
      body: text || null,
      fileUrl: fileUrl || null,
      authorId: user.id,
    },
    include: { author: { select: { firstName: true, lastName: true } } },
  });
  await awardPoints(user.id, "COURSE_RESOURCE");

  return NextResponse.json({ resource }, { status: 201 });
}
