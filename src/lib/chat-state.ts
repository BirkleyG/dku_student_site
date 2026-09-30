import { prisma } from "@/lib/prisma";

// Per-user chat state: what you've read and where you've been @mentioned.
//
// Unread = messages from other people newer than the chat's read baseline. The baseline is the stored
// ChatReadState; with none yet it's the day you joined the group/DM (or signed up, for General). The open chat
// refreshes the baseline on every poll, so it stays at zero while you're looking at it.

/** Mark a chat read for a user: bump the baseline and clear their unread mentions in it. */
export async function markChannelRead(userId: string, channelId: string): Promise<void> {
  const now = new Date();
  await Promise.all([
    prisma.chatReadState.upsert({
      where: { userId_channelId: { userId, channelId } },
      create: { userId, channelId, lastReadAt: now },
      update: { lastReadAt: now },
    }),
    prisma.chatMention.updateMany({ where: { userId, readAt: null, message: { channelId } }, data: { readAt: now } }),
  ]);
}

/** Unread message counts for each of the user's chats, keyed by channel id. */
export async function getUnreadCounts(user: { id: string; createdAt: Date }, channelIds: string[]): Promise<Record<string, number>> {
  if (!channelIds.length) return {};
  const [states, memberships] = await Promise.all([
    prisma.chatReadState.findMany({ where: { userId: user.id, channelId: { in: channelIds } }, select: { channelId: true, lastReadAt: true } }),
    prisma.chatChannelMember.findMany({ where: { userId: user.id, channelId: { in: channelIds } }, select: { channelId: true, joinedAt: true } }),
  ]);
  const read = new Map(states.map((s) => [s.channelId, s.lastReadAt]));
  const joined = new Map(memberships.map((m) => [m.channelId, m.joinedAt]));
  const entries = await Promise.all(
    channelIds.map(async (channelId) => {
      const baseline = read.get(channelId) ?? joined.get(channelId) ?? user.createdAt;
      const count = await prisma.chatMessage.count({ where: { channelId, authorId: { not: user.id }, createdAt: { gt: baseline } } });
      return [channelId, count] as const;
    }),
  );
  return Object.fromEntries(entries);
}

/** Unread @mentions of the user, keyed by channel id. */
export async function getMentionCounts(userId: string): Promise<Record<string, number>> {
  const rows = await prisma.chatMention.findMany({ where: { userId, readAt: null }, select: { message: { select: { channelId: true } } } });
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.message.channelId] = (counts[r.message.channelId] ?? 0) + 1;
  return counts;
}

/**
 * Which of the claimed mentions are real: the person exists, isn't the author, is actually in this chat, and the
 * message text really contains "@First Last". Anything else is dropped silently.
 */
export async function validateMentions(params: {
  channel: { id: string; kind: "GENERAL" | "GROUP" | "DIRECT" };
  authorId: string;
  body: string;
  userIds: string[];
}): Promise<string[]> {
  const ids = [...new Set(params.userIds)].filter((id) => id !== params.authorId);
  if (!ids.length) return [];
  const users = await prisma.user.findMany({
    where: {
      id: { in: ids },
      ...(params.channel.kind === "GENERAL" ? {} : { chatChannelMemberships: { some: { channelId: params.channel.id } } }),
    },
    select: { id: true, firstName: true, lastName: true },
  });
  const body = params.body.toLowerCase();
  return users.filter((u) => body.includes(`@${u.firstName} ${u.lastName}`.toLowerCase())).map((u) => u.id);
}
