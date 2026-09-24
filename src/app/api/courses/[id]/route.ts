import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { courseDescriptionSchema } from "@/lib/course-validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      offerings: { include: { professor: true } },
      resources: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ course });
}

// Description is a shared field anyone logged in can fill in or improve —
// the course is created with none so the create form stays minimal.
export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = courseDescriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const course = await prisma.course.update({
    where: { id },
    data: { description: parsed.data.description || null },
  });

  return NextResponse.json({ course });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { id } = await params;
  const [user, course] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.course.findUnique({ where: { id } }),
  ]);

  if (!user || !course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (course.createdById !== user.id && !hasScope(user, "COURSES")) {
    return NextResponse.json({ error: "You can't remove this course" }, { status: 403 });
  }

  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
