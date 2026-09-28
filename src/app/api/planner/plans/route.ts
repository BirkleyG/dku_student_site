import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planCreateSchema } from "@/lib/planner-validation";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const plans = await prisma.academicPlan.findMany({
    where: { userId: user.id },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    include: { courses: { orderBy: [{ year: "asc" }, { semester: "asc" }, { session: "asc" }] } },
  });

  return NextResponse.json({ plans });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = planCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, major, track } = parsed.data;

  const existingCount = await prisma.academicPlan.count({ where: { userId: user.id } });

  const plan = await prisma.academicPlan.create({
    data: {
      userId: user.id,
      name,
      major,
      track: track || undefined,
      isPrimary: existingCount === 0,
    },
    include: { courses: true },
  });

  return NextResponse.json({ plan }, { status: 201 });
}
