import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { courseSchema } from "@/lib/course-validation";
import { awardPoints } from "@/lib/community-score";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();

  const courses = await prisma.course.findMany({
    where: q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { title: { contains: q, mode: "insensitive" } },
            { department: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { code: "asc" },
    include: {
      offerings: { include: { professor: { select: { id: true, firstName: true, lastName: true } } } },
      _count: { select: { resources: true } },
    },
  });

  return NextResponse.json({ courses });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to add a course" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = courseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const {
    code,
    title,
    department,
    description,
    professorId,
    newProfessorFirstName,
    newProfessorLastName,
    newProfessorDepartment,
    semester,
  } = parsed.data;

  const existingCourse = await prisma.course.findUnique({ where: { code: code.toUpperCase() } });
  if (existingCourse) {
    return NextResponse.json({ error: "That course code already exists" }, { status: 409 });
  }

  let resolvedProfessorId = professorId || null;
  let awardedProfessorPoints = false;

  if (!resolvedProfessorId && newProfessorFirstName && newProfessorLastName) {
    const professor = await prisma.professor.create({
      data: {
        firstName: newProfessorFirstName,
        lastName: newProfessorLastName,
        department: newProfessorDepartment || department,
        addedById: user.id,
      },
    });
    resolvedProfessorId = professor.id;
    awardedProfessorPoints = true;
  }

  const course = await prisma.course.create({
    data: {
      code: code.toUpperCase(),
      title,
      department,
      description: description || null,
      createdById: user.id,
      offerings: resolvedProfessorId
        ? { create: { professorId: resolvedProfessorId, semester: semester || "Unspecified" } }
        : undefined,
    },
    include: { offerings: { include: { professor: true } } },
  });

  await awardPoints(user.id, "COURSE_ADDED");
  if (awardedProfessorPoints) await awardPoints(user.id, "PROFESSOR_ADDED");

  return NextResponse.json({ course }, { status: 201 });
}
