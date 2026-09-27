import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { plannedCourseCreateSchema } from "@/lib/planner-validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { id: planId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = plannedCourseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const plan = await prisma.academicPlan.findFirst({ where: { id: planId, userId: user.id } });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { year, semester, session: sessionSlot, code, title, credits, isCrNc, genEdTags } = parsed.data;

  const course = await prisma.plannedCourse.create({
    data: {
      planId,
      year,
      semester,
      session: sessionSlot,
      code: code.toUpperCase(),
      title: title || undefined,
      credits: credits || undefined,
      isCrNc: isCrNc ?? false,
      genEdTags: genEdTags ?? [],
    },
  });

  return NextResponse.json({ course }, { status: 201 });
}
