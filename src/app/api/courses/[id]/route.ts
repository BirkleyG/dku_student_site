import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";

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
