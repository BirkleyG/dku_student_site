import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

async function canManage(userId: string, club: { submittedById: string; id: string }) {
  if (userId === club.submittedById) return true;
  const membership = await prisma.clubMembership.findUnique({
    where: { clubId_userId: { clubId: club.id, userId } },
  });
  return membership?.role === "MANAGER";
}

/** Manager-only: add a member directly by email — for clubs with roster (open-join off). */
export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Log in" }, { status: 401 });

  const { id } = await params;
  const [manager, club] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.club.findUnique({ where: { id } }),
  ]);
  if (!manager || !club) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await canManage(manager.id, club)) && !hasScope(manager, "CLUBS")) {
    return NextResponse.json({ error: "Only club managers can add members" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ error: "Enter an email address" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { email } });
  if (!target) return NextResponse.json({ error: "No user with that email" }, { status: 404 });

  const membership = await prisma.clubMembership.upsert({
    where: { clubId_userId: { clubId: id, userId: target.id } },
    create: { clubId: id, userId: target.id },
    update: {},
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  return NextResponse.json({ membership }, { status: 201 });
}
