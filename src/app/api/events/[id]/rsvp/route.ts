import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to RSVP" }, { status: 401 });
  }

  const { id: eventId } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.rsvp.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
  });

  if (existing) {
    await prisma.rsvp.delete({ where: { id: existing.id } });
    return NextResponse.json({ going: false });
  }

  await prisma.rsvp.create({ data: { eventId, userId: user.id } });
  return NextResponse.json({ going: true });
}
