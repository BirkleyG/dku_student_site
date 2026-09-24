import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { courseCreateSchema } from "@/lib/course-validation";
import { DKU_DEPARTMENTS } from "@/lib/departments";
import { awardPoints } from "@/lib/community-score";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  const department = url.searchParams.get("department");
  const validDepartment =
    department && (DKU_DEPARTMENTS as readonly string[]).includes(department) ? department : undefined;

  const courses = await prisma.course.findMany({
    where: {
      department: validDepartment,
      ...(q
        ? {
            OR: [
              { code: { contains: q, mode: "insensitive" } },
              { title: { contains: q, mode: "insensitive" } },
              { department: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { code: "asc" },
    include: {
      offerings: { include: { professor: { select: { id: true, firstName: true, lastName: true } } } },
      _count: { select: { resources: true, comments: true } },
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
  const parsed = courseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { code, title, department, otherDepartment, credits } = parsed.data;
  const resolvedDepartment = department === "Other" && otherDepartment ? otherDepartment : department;

  const existingCourse = await prisma.course.findUnique({ where: { code: code.toUpperCase() } });
  if (existingCourse) {
    return NextResponse.json({ error: "That course code already exists" }, { status: 409 });
  }

  const course = await prisma.course.create({
    data: {
      code: code.toUpperCase(),
      title,
      department: resolvedDepartment,
      credits: credits || null,
      createdById: user.id,
    },
  });

  await awardPoints(user.id, "COURSE_ADDED");

  return NextResponse.json({ course }, { status: 201 });
}
