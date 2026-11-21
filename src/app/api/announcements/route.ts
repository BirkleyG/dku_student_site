import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";
import { announcementSchema } from "@/lib/announcement-validation";
import { MAX_HOURS, expiresAt, isVisible, rankAnnouncements, tally } from "@/lib/announcement-rank";

const include = {
  author: { select: { id: true, firstName: true, lastName: true } },
  event: { select: { id: true, title: true, startsAt: true } },
  votes: { select: { userId: true, value: true } },
} as const;

type Row = Awaited<ReturnType<typeof loadRows>>[number];

function loadRows(since: Date) {
  return prisma.announcement.findMany({ where: { createdAt: { gte: since } }, include, orderBy: { createdAt: "desc" }, take: 300 });
}

function serialize(a: Row, userId: string | null, now = new Date()) {
  const t = tally(a.votes);
  return {
    id: a.id,
    title: a.title,
    body: a.body,
    createdAt: a.createdAt.toISOString(),
    expiresAt: expiresAt({ createdAt: a.createdAt, ...t }).toISOString(),
    visible: isVisible({ createdAt: a.createdAt, ...t }, now),
    up: t.up,
    down: t.down,
    myVote: a.votes.find((v) => v.userId === userId)?.value ?? 0,
    author: a.author,
    event: a.event ? { id: a.event.id, title: a.event.title, startsAt: a.event.startsAt.toISOString() } : null,
  };
}

/** Ranked, currently visible announcements. Nothing older than the 30-day max lifetime can be visible. */
export async function GET() {
  const user = await getSessionUser();
  const now = new Date();
  const rows = await loadRows(new Date(now.getTime() - MAX_HOURS * 3_600_000));
  const ranked = rankAnnouncements(rows.map((r) => ({ ...r, ...tally(r.votes) })), now);
  return NextResponse.json({ announcements: ranked.map((r) => serialize(r, user?.id ?? null, now)) });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Log in to post an announcement" }, { status: 401 });

  const parsed = announcementSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  // Light flood guard: max 3 posts per person per 24h.
  const recent = await prisma.announcement.count({
    where: { authorId: user.id, createdAt: { gte: new Date(Date.now() - 86_400_000) } },
  });
  if (recent >= 3) return NextResponse.json({ error: "You can post 3 announcements a day" }, { status: 429 });

  const { title, body, eventId } = parsed.data;
  if (eventId) {
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) return NextResponse.json({ error: "That event no longer exists" }, { status: 400 });
  }

  const created = await prisma.announcement.create({
    data: { title, body, eventId: eventId || null, authorId: user.id },
    include,
  });
  return NextResponse.json({ announcement: serialize(created, user.id) }, { status: 201 });
}
