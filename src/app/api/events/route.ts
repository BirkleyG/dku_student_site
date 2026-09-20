import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/event-validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const events = await prisma.event.findMany({
    where: {
      approved: true,
      ...(from || to
        ? {
            startsAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { startsAt: "asc" },
    include: { host: { select: { firstName: true, lastName: true } }, _count: { select: { rsvps: true } } },
  });

  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to create an event" }, { status: 401 });
  }
  if (!session.user.verified) {
    return NextResponse.json({ error: "Verify your DKU email before creating events" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = user.role === "ADMIN";
  const { title, description, location, posterUrl, startsAt, endsAt, recurrence, category } = parsed.data;

  const event = await prisma.event.create({
    data: {
      title,
      description,
      location,
      posterUrl: posterUrl || null,
      startsAt,
      endsAt,
      // Recurring events require admin approval — non-admins are silently capped to a one-off.
      recurrence: isAdmin ? recurrence : "NONE",
      category,
      hostId: user.id,
    },
  });

  return NextResponse.json({ event }, { status: 201 });
}
