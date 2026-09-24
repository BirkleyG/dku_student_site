import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";

type Params = { params: Promise<{ id: string; userId: string }> };

async function canManage(userId: string, club: { submittedById: string; id: string }) {
  if (userId === club.submittedById) return true;
  const membership = await prisma.clubMembership.findUnique({
    where: { clubId_userId: { clubId: club.id, userId } },
  });
  return membership?.role === "MANAGER";
}

/** Manager-only: promote/demote a member's role. */
export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Log in" }, { status: 401 });

  const { id, userId } = await params;
  const [manager, club] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.club.findUnique({ where: { id } }),
  ]);
  if (!manager || !club) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await canManage(manager.id, club)) && !hasScope(manager, "CLUBS")) {
    return NextResponse.json({ error: "Only club managers can change roles" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const role = body?.role === "MANAGER" ? "MANAGER" : body?.role === "MEMBER" ? "MEMBER" : null;
  if (!role) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const membership = await prisma.clubMembership.update({
    where: { clubId_userId: { clubId: id, userId } },
    data: { role },
  });

  return NextResponse.json({ membership });
}

/** Manager-only: remove a member from the roster. */
export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Log in" }, { status: 401 });

  const { id, userId } = await params;
  const [manager, club] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.club.findUnique({ where: { id } }),
  ]);
  if (!manager || !club) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (userId === club.submittedById) {
    return NextResponse.json({ error: "Can't remove the club's creator" }, { status: 400 });
  }
  if (!(await canManage(manager.id, club)) && !hasScope(manager, "CLUBS")) {
    return NextResponse.json({ error: "Only club managers can remove members" }, { status: 403 });
  }

  await prisma.clubMembership.deleteMany({ where: { clubId: id, userId } });
  return NextResponse.json({ ok: true });
}
