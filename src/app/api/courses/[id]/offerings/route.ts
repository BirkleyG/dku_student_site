import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { courseOfferingSchema } from "@/lib/course-validation";
import { awardPoints } from "@/lib/community-score";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to link a professor" }, { status: 401 });
  }

  const { id: courseId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = courseOfferingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const [user, course] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.course.findUnique({ where: { id: courseId } }),
  ]);
  if (!user || !course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { professorId, newProfessorFirstName, newProfessorLastName, newProfessorDepartment, semester } = parsed.data;
  if (!professorId && !(newProfessorFirstName && newProfessorLastName)) {
    return NextResponse.json({ error: "Pick a professor or add a new one" }, { status: 400 });
  }

  let resolvedProfessorId = professorId || null;
  let awardedProfessorPoints = false;

  if (!resolvedProfessorId && newProfessorFirstName && newProfessorLastName) {
    const professor = await prisma.professor.create({
      data: {
        firstName: newProfessorFirstName,
        lastName: newProfessorLastName,
        department: newProfessorDepartment || course.department,
        addedById: user.id,
      },
    });
    resolvedProfessorId = professor.id;
    awardedProfessorPoints = true;
  }

  const existing = await prisma.courseOffering.findUnique({
    where: {
      courseId_professorId_semester: {
        courseId,
        professorId: resolvedProfessorId!,
        semester: semester || "Unspecified",
      },
    },
  });
  if (existing) {
    return NextResponse.json({ error: "That professor is already linked for that semester" }, { status: 409 });
  }

  const offering = await prisma.courseOffering.create({
    data: { courseId, professorId: resolvedProfessorId!, semester: semester || "Unspecified" },
    include: { professor: true },
  });

  if (awardedProfessorPoints) await awardPoints(user.id, "PROFESSOR_ADDED");

  return NextResponse.json({ offering }, { status: 201 });
}
