import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Log in to join" }, { status: 401 });

  const { id } = await params;
  const [user, club] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.club.findUnique({ where: { id } }),
  ]);
  if (!user || !club) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!club.openJoin) {
    return NextResponse.json({ error: "This club manages its own roster — ask an officer to add you." }, { status: 403 });
  }

  await prisma.clubMembership.upsert({
    where: { clubId_userId: { clubId: id, userId: user.id } },
    create: { clubId: id, userId: user.id },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Log in" }, { status: 401 });

  const { id } = await params;
  const [user, club] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.club.findUnique({ where: { id } }),
  ]);
  if (!user || !club) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (club.submittedById === user.id) {
    return NextResponse.json({ error: "The club creator can't leave. Transfer ownership first." }, { status: 400 });
  }

  await prisma.clubMembership.deleteMany({ where: { clubId: id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
