import { prisma } from "@/lib/prisma";
import { ACHIEVEMENT_BY_ID } from "@/lib/achievements";
import { campusDayKey } from "@/lib/datetime";

// Follow / friends model.
//   - Following is one-way. Who you follow decides whose activity you get updates about.
//   - "Friends" are people who follow each other. Friends additionally see each other's online status and
//     (opt-in) birthdays.
// Everything a person shares is gated by their own switches on the User row (shareActivity, showOnlineStatus,
// showBirthday), enforced here on the server, never in the client.

/** Someone counts as online if their last heartbeat was this recent. */
export const ONLINE_WINDOW_MS = 3 * 60 * 1000;
const ACTIVITY_WINDOW_DAYS = 30;

export type Person = {
  id: string;
  name: string;
  /** I follow them. */
  following: boolean;
  /** They follow me. */
  followsMe: boolean;
  /** Mutual follow. */
  friend: boolean;
  /** Only ever true for mutual friends who haven't hidden their status. */
  online: boolean;
};

type UserLite = { id: string; firstName: string; lastName: string; lastSeenAt: Date | null; showOnlineStatus: boolean };
const userLite = { id: true, firstName: true, lastName: true, lastSeenAt: true, showOnlineStatus: true } as const;

export const fullName = (u: { firstName: string; lastName: string }) => `${u.firstName} ${u.lastName}`;

export function isOnline(u: { lastSeenAt: Date | null; showOnlineStatus: boolean }, now = Date.now()): boolean {
  return u.showOnlineStatus && u.lastSeenAt !== null && now - u.lastSeenAt.getTime() < ONLINE_WINDOW_MS;
}

function toPerson(u: UserLite, relation: { following: boolean; followsMe: boolean }, now: number): Person {
  const friend = relation.following && relation.followsMe;
  return { id: u.id, name: fullName(u), ...relation, friend, online: friend && isOnline(u, now) };
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  const rows = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
  return rows.map((r) => r.followingId);
}

/** Mutual follows. */
export async function getFriendIds(userId: string): Promise<string[]> {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId, following: { following: { some: { followingId: userId } } } },
    select: { followingId: true },
  });
  return rows.map((r) => r.followingId);
}

/** Everyone I follow and everyone who follows me, with how each relates to me. */
export async function getConnections(userId: string): Promise<{ following: Person[]; followers: Person[] }> {
  const now = Date.now();
  const [iFollow, followMe] = await Promise.all([
    prisma.follow.findMany({ where: { followerId: userId }, include: { following: { select: userLite } }, orderBy: { createdAt: "desc" } }),
    prisma.follow.findMany({ where: { followingId: userId }, include: { follower: { select: userLite } }, orderBy: { createdAt: "desc" } }),
  ]);
  const followingSet = new Set(iFollow.map((f) => f.followingId));
  const followersSet = new Set(followMe.map((f) => f.followerId));
  return {
    following: iFollow.map((f) => toPerson(f.following, { following: true, followsMe: followersSet.has(f.followingId) }, now)),
    followers: followMe.map((f) => toPerson(f.follower, { following: followingSet.has(f.followerId), followsMe: true }, now)),
  };
}

/** Name search for the "Find people" tab, annotated with how each result relates to the caller. */
export async function searchPeople(userId: string, query: string): Promise<Person[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const users = await prisma.user.findMany({
    where: {
      id: { not: userId },
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { netId: { equals: q, mode: "insensitive" } },
      ],
    },
    select: userLite,
    orderBy: { firstName: "asc" },
    take: 10,
  });
  if (!users.length) return [];
  const ids = users.map((u) => u.id);
  const [iFollow, followMe] = await Promise.all([
    prisma.follow.findMany({ where: { followerId: userId, followingId: { in: ids } }, select: { followingId: true } }),
    prisma.follow.findMany({ where: { followingId: userId, followerId: { in: ids } }, select: { followerId: true } }),
  ]);
  const a = new Set(iFollow.map((f) => f.followingId));
  const b = new Set(followMe.map((f) => f.followerId));
  const now = Date.now();
  return users.map((u) => toPerson(u, { following: a.has(u.id), followsMe: b.has(u.id) }, now));
}

export type ActivityKind = "RSVP" | "HOST" | "CLUB" | "TIP" | "DEAR" | "ACHIEVEMENT";

export type ActivityItem = {
  id: string;
  userId: string;
  name: string;
  kind: ActivityKind;
  /** The thing they did it to: event title, club name, tip name, post title, achievement name. */
  subject: string;
  /** Chinese name for achievements (the only subject that has one). */
  subjectZh?: string;
  at: string;
  href: string | null;
};

/**
 * What the people I follow have been up to in the last 30 days, newest first. Derived on read from the tables
 * the actions already write to, so nothing has to be hooked into each feature. Only people with "share my
 * activity" on are included.
 */
export async function getFriendActivity(userId: string, limit = 40): Promise<ActivityItem[]> {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId, following: { shareActivity: true } },
    select: { following: { select: { id: true, firstName: true, lastName: true } } },
  });
  if (!follows.length) return [];
  const people = new Map(follows.map((f) => [f.following.id, fullName(f.following)]));
  const ids = [...people.keys()];
  const since = new Date(Date.now() - ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const newest = { orderBy: { createdAt: "desc" as const }, take: limit };

  const [rsvps, hosted, clubs, tips, posts, achievements] = await Promise.all([
    prisma.rsvp.findMany({
      where: { userId: { in: ids }, createdAt: { gte: since }, event: { approved: true } },
      include: { event: { select: { id: true, title: true } } },
      ...newest,
    }),
    prisma.event.findMany({
      where: { hostId: { in: ids }, createdAt: { gte: since }, approved: true, kind: "EVENT" },
      select: { id: true, title: true, hostId: true, createdAt: true },
      ...newest,
    }),
    prisma.clubMembership.findMany({
      where: { userId: { in: ids }, joinedAt: { gte: since }, club: { approved: true } },
      include: { club: { select: { id: true, name: true } } },
      orderBy: { joinedAt: "desc" },
      take: limit,
    }),
    prisma.wisdomRecommendation.findMany({
      where: { authorId: { in: ids }, createdAt: { gte: since } },
      select: { id: true, placeName: true, authorId: true, topicId: true, createdAt: true },
      ...newest,
    }),
    prisma.dearDkuPost.findMany({
      where: { authorId: { in: ids }, createdAt: { gte: since } },
      select: { id: true, title: true, authorId: true, createdAt: true },
      ...newest,
    }),
    prisma.pointEvent.findMany({
      where: { userId: { in: ids }, kind: "ACHIEVEMENT", createdAt: { gte: since } },
      select: { id: true, key: true, userId: true, createdAt: true },
      ...newest,
    }),
  ]);

  const nameOf = (id: string) => people.get(id) ?? "Someone";
  const items: ActivityItem[] = [
    ...rsvps.map((r): ActivityItem => ({ id: `rsvp:${r.id}`, userId: r.userId, name: nameOf(r.userId), kind: "RSVP", subject: r.event.title, at: r.createdAt.toISOString(), href: `/events/${r.event.id}` })),
    ...hosted.map((e): ActivityItem => ({ id: `host:${e.id}`, userId: e.hostId, name: nameOf(e.hostId), kind: "HOST", subject: e.title, at: e.createdAt.toISOString(), href: `/events/${e.id}` })),
    ...clubs.map((m): ActivityItem => ({ id: `club:${m.id}`, userId: m.userId, name: nameOf(m.userId), kind: "CLUB", subject: m.club.name, at: m.joinedAt.toISOString(), href: `/clubs/${m.club.id}` })),
    ...tips.map((r): ActivityItem => ({ id: `tip:${r.id}`, userId: r.authorId, name: nameOf(r.authorId), kind: "TIP", subject: r.placeName, at: r.createdAt.toISOString(), href: `/wisdom/${r.topicId}` })),
    ...posts.map((p): ActivityItem => ({ id: `dear:${p.id}`, userId: p.authorId, name: nameOf(p.authorId), kind: "DEAR", subject: p.title, at: p.createdAt.toISOString(), href: `/dear-dku/${p.id}` })),
    ...achievements.flatMap((a): ActivityItem[] => {
      const def = ACHIEVEMENT_BY_ID[a.key.slice(4)];
      return def
        ? [{ id: `ach:${a.id}`, userId: a.userId, name: nameOf(a.userId), kind: "ACHIEVEMENT", subject: `${def.emoji} ${def.name}`, subjectZh: `${def.emoji} ${def.nameZh}`, at: a.createdAt.toISOString(), href: null }]
        : [];
    }),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

/** How many activity items are newer than the last time this user opened the Friends panel. */
export async function countUnseenActivity(user: { id: string; friendsSeenAt: Date | null }): Promise<number> {
  const items = await getFriendActivity(user.id, 50);
  const seen = user.friendsSeenAt?.toISOString() ?? null;
  return seen ? items.filter((i) => i.at > seen).length : items.length;
}

/** Mutual friends who are online right now and haven't hidden their status. */
export async function getOnlineFriends(userId: string): Promise<Person[]> {
  const since = new Date(Date.now() - ONLINE_WINDOW_MS);
  const rows = await prisma.follow.findMany({
    where: {
      followerId: userId,
      following: { showOnlineStatus: true, lastSeenAt: { gte: since }, following: { some: { followingId: userId } } },
    },
    include: { following: { select: userLite } },
  });
  const now = Date.now();
  return rows.map((r) => toPerson(r.following, { following: true, followsMe: true }, now)).sort((a, b) => a.name.localeCompare(b.name));
}

export type UpcomingBirthday = { id: string; name: string; month: number; day: number; daysAway: number };

/** Days until the next occurrence of a month/day, counting from today's campus date (0 = today). */
export function daysUntilBirthday(month: number, day: number, now: Date = new Date()): number {
  const [y, m, d] = campusDayKey(now).split("-").map(Number);
  const today = Date.UTC(y, m - 1, d);
  let next = Date.UTC(y, month - 1, day);
  // Feb 29 birthdays land on Mar 1 in non-leap years (Date.UTC already rolls over).
  if (next < today) next = Date.UTC(y + 1, month - 1, day);
  return Math.round((next - today) / 86_400_000);
}

/** Mutual friends who opted in to sharing their birthday, soonest first. */
export async function getUpcomingBirthdays(userId: string, withinDays = 45, now: Date = new Date()): Promise<UpcomingBirthday[]> {
  const rows = await prisma.follow.findMany({
    where: {
      followerId: userId,
      following: { showBirthday: true, birthdayMonth: { not: null }, birthdayDay: { not: null }, following: { some: { followingId: userId } } },
    },
    select: { following: { select: { id: true, firstName: true, lastName: true, birthdayMonth: true, birthdayDay: true } } },
  });
  return rows
    .flatMap((r) => {
      const u = r.following;
      if (u.birthdayMonth === null || u.birthdayDay === null) return [];
      return [{ id: u.id, name: fullName(u), month: u.birthdayMonth, day: u.birthdayDay, daysAway: daysUntilBirthday(u.birthdayMonth, u.birthdayDay, now) }];
    })
    .filter((b) => b.daysAway <= withinDays)
    .sort((a, b) => a.daysAway - b.daysAway || a.name.localeCompare(b.name));
}
