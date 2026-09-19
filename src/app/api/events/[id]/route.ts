import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      host: { select: { firstName: true, lastName: true } },
      rsvps: { select: { userId: true } },
    },
  });

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ event });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { id } = await params;
  const [user, event] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.event.findUnique({ where: { id } }),
  ]);

  if (!user || !event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (event.hostId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "You can't remove this event" }, { status: 403 });
  }

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
