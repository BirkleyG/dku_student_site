import { NextResponse } from "next/server";
import type { CourseExamType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { courseExamTypeLabels, courseResourceSchema } from "@/lib/course-validation";
import { UPLOAD_URL_PREFIX } from "@/lib/uploads";
import { awardPoints } from "@/lib/points";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to share a resource" }, { status: 401 });
  }

  const { id: courseId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = courseResourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const input = parsed.data;

  const [user, course] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.course.findUnique({ where: { id: courseId } }),
  ]);
  if (!user || !course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // A file we host has to actually exist — the link alone proves nothing.
  if (input.fileUrl.startsWith(UPLOAD_URL_PREFIX)) {
    const uploadId = input.fileUrl.slice(UPLOAD_URL_PREFIX.length);
    const upload = await prisma.upload.findUnique({ where: { id: uploadId }, select: { id: true } });
    if (!upload) return NextResponse.json({ error: "That upload wasn't found. Attach the file again." }, { status: 400 });
  }

  let title: string;
  let professorId: string | null = null;
  let semester: string | null = null;
  let examType: CourseExamType | null = null;
  let text: string | null = null;

  if (input.type === "MATERIALS") {
    title = input.title;
    text = input.body || null;
  } else {
    const professor = await prisma.professor.findUnique({
      where: { id: input.professorId },
      select: { id: true, lastName: true },
    });
    if (!professor) return NextResponse.json({ error: "That professor wasn't found" }, { status: 400 });
    professorId = professor.id;
    if (input.type === "SYLLABUS") {
      semester = input.semester;
      title = `Syllabus — ${input.semester} — ${professor.lastName}`;
    } else {
      examType = input.examType;
      title = `${courseExamTypeLabels[input.examType]} exam — ${professor.lastName}`;
    }
  }

  const resource = await prisma.courseResource.create({
    data: {
      courseId,
      type: input.type,
      title,
      semester,
      body: text,
      fileUrl: input.fileUrl,
      fileName: input.fileName || null,
      professorId,
      examType,
      authorId: user.id,
    },
    include: {
      author: { select: { firstName: true, lastName: true } },
      professor: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  await awardPoints(user.id, "COURSE_MATERIAL", resource.id);

  return NextResponse.json({ resource }, { status: 201 });
}
