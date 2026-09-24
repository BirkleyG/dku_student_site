import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const professor = await prisma.professor.findUnique({
    where: { id },
    include: {
      offerings: { include: { course: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { firstName: true, lastName: true } }, course: { select: { code: true, title: true } } },
      },
    },
  });

  if (!professor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ professor });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { id } = await params;
  const [user, professor] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.professor.findUnique({ where: { id } }),
  ]);

  if (!user || !professor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (professor.addedById !== user.id && !hasScope(user, "PROFESSORS")) {
    return NextResponse.json({ error: "You can't remove this professor" }, { status: 403 });
  }

  await prisma.professor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || !hasScope(user, "PROFESSORS")) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.verified !== "boolean") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const professor = await prisma.professor.update({ where: { id }, data: { verified: body.verified } });
  return NextResponse.json({ professor });
}
