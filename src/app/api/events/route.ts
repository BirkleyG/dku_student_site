import { NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/event-validation";
import { broadcastPush } from "@/lib/push";
import { EVENT_CATEGORY_MAP } from "@/lib/event-categories";

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

  // Notify subscribed users after the response goes out — a push failure or
  // slow push service should never delay or break event creation. `after()`
  // still runs to completion (including our own retry/backoff) even though
  // the response has already been sent.
  after(async () => {
    const categoryLabel = EVENT_CATEGORY_MAP[event.category]?.label ?? "Events";
    await broadcastPush(
      {
        category: "EVENTS",
        title: `New event: ${event.title}`,
        body: `${categoryLabel} · ${event.location}`,
        url: `/events/${event.id}`,
      },
      { excludeUserId: user.id },
    );
  });

  return NextResponse.json({ event }, { status: 201 });
}
