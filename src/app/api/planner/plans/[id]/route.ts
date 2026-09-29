import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planUpdateSchema } from "@/lib/planner-validation";

type Params = { params: Promise<{ id: string }> };

async function loadOwnedPlan(planId: string, userId: string) {
  return prisma.academicPlan.findFirst({ where: { id: planId, userId } });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = planUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await loadOwnedPlan(id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, major, track, isPrimary, miniTermCompleted } = parsed.data;

  // Only one plan can be primary — flipping one on flips every other off.
  if (isPrimary) {
    await prisma.academicPlan.updateMany({
      where: { userId: user.id, id: { not: id } },
      data: { isPrimary: false },
    });
  }

  const plan = await prisma.academicPlan.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(major !== undefined ? { major } : {}),
      ...(track !== undefined ? { track } : {}),
      ...(isPrimary !== undefined ? { isPrimary } : {}),
      ...(miniTermCompleted !== undefined ? { miniTermCompleted } : {}),
    },
    include: { courses: true },
  });

  return NextResponse.json({ plan });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await loadOwnedPlan(id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.academicPlan.delete({ where: { id } });

  // If the deleted plan was primary, promote the oldest remaining one.
  if (existing.isPrimary) {
    const next = await prisma.academicPlan.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await prisma.academicPlan.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
  }

  return NextResponse.json({ ok: true });
}
