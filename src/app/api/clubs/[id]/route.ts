import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { clubSchema } from "@/lib/club-validation";

type Params = { params: Promise<{ id: string }> };

async function isManager(userId: string, club: { submittedById: string; id: string }) {
  if (userId === club.submittedById) return true;
  const membership = await prisma.clubMembership.findUnique({
    where: { clubId_userId: { clubId: club.id, userId } },
  });
  return membership?.role === "MANAGER";
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const session = await auth();

  const club = await prisma.club.findUnique({
    where: { id },
    include: {
      officers: true,
      _count: { select: { members: true } },
      members: {
        select: { userId: true, role: true, joinedAt: true, user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const currentUser = session?.user?.email
    ? await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true, adminScopes: true } })
    : null;

  const myMembership = currentUser ? club.members.find((m) => m.userId === currentUser.id) ?? null : null;
  const canManage = currentUser
    ? currentUser.id === club.submittedById || myMembership?.role === "MANAGER" || hasScope(currentUser, "CLUBS")
    : false;

  return NextResponse.json({
    club,
    isMember: Boolean(myMembership),
    canManage,
    canDelete: currentUser ? currentUser.id === club.submittedById || hasScope(currentUser, "CLUBS") : false,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Log in" }, { status: 401 });

  const { id } = await params;
  const [user, club] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.club.findUnique({ where: { id } }),
  ]);
  if (!user || !club) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isManager(user.id, club)) && !hasScope(user, "CLUBS")) {
    return NextResponse.json({ error: "You can't edit this club" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = clubSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { officers, contactValue, contactQrUrl, website, logoUrl, sportName, athleticKind, ...rest } = parsed.data;

  const updated = await prisma.club.update({
    where: { id },
    data: {
      ...rest,
      athleticKind: rest.category === "ATHLETIC" ? athleticKind : null,
      sportName: sportName || null,
      contactValue: contactValue || null,
      contactQrUrl: contactQrUrl || null,
      website: website || null,
      logoUrl: logoUrl || null,
      officers: {
        deleteMany: {},
        create: officers
          .filter((o) => o.name && o.title)
          .map((o) => ({ name: o.name, title: o.title, contact: o.contact || null })),
      },
    },
    include: { officers: true, _count: { select: { members: true } } },
  });

  return NextResponse.json({ club: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { id } = await params;
  const [user, club] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.club.findUnique({ where: { id } }),
  ]);

  if (!user || !club) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (club.submittedById !== user.id && !hasScope(user, "CLUBS")) {
    return NextResponse.json({ error: "You can't remove this club" }, { status: 403 });
  }

  await prisma.club.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
