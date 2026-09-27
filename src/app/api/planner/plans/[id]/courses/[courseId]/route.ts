import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { plannedCourseUpdateSchema } from "@/lib/planner-validation";

type Params = { params: Promise<{ id: string; courseId: string }> };

async function loadOwnedCourse(planId: string, courseId: string, userId: string) {
  return prisma.plannedCourse.findFirst({
    where: { id: courseId, planId, plan: { userId } },
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { id: planId, courseId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = plannedCourseUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await loadOwnedCourse(planId, courseId, user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { year, semester, session: sessionSlot, code, title, credits, isCrNc, genEdTags } = parsed.data;

  const course = await prisma.plannedCourse.update({
    where: { id: courseId },
    data: {
      ...(year !== undefined ? { year } : {}),
      ...(semester !== undefined ? { semester } : {}),
      ...(sessionSlot !== undefined ? { session: sessionSlot } : {}),
      ...(code !== undefined ? { code: code.toUpperCase() } : {}),
      ...(title !== undefined ? { title: title || null } : {}),
      ...(credits !== undefined ? { credits: credits || null } : {}),
      ...(isCrNc !== undefined ? { isCrNc } : {}),
      ...(genEdTags !== undefined ? { genEdTags } : {}),
    },
  });

  return NextResponse.json({ course });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { id: planId, courseId } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await loadOwnedCourse(planId, courseId, user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.plannedCourse.delete({ where: { id: courseId } });

  return NextResponse.json({ ok: true });
}
