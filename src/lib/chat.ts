import type { ChatChannelKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { broadcastPush, sendPushToUser, type PushPayload } from "@/lib/push";

export const GENERAL_CHANNEL_ID = "general";

/** The single sitewide group chat. Every logged-in user is implicitly a member — lazily created on first touch. */
export async function ensureGeneralChannel() {
  return prisma.chatChannel.upsert({
    where: { id: GENERAL_CHANNEL_ID },
    update: {},
    create: {
      id: GENERAL_CHANNEL_ID,
      kind: "GENERAL",
      name: "DKU Life",
      description: "The big group chat — everyone's in it.",
    },
  });
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

/** Short, human-typable invite code for a group channel. */
export function generateInviteCode(length = 7): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** True for GENERAL (everyone's implicitly in it) or an explicit membership row. */
export async function isChannelMember(channelId: string, userId: string): Promise<boolean> {
  const channel = await prisma.chatChannel.findUnique({ where: { id: channelId }, select: { kind: true } });
  if (!channel) return false;
  if (channel.kind === "GENERAL") return true;
  const membership = await prisma.chatChannelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
  });
  return Boolean(membership);
}

/** Finds the existing 1:1 DIRECT channel between two users, or creates one. */
export async function findOrCreateDmChannel(userAId: string, userBId: string) {
  const existing = await prisma.chatChannel.findFirst({
    where: {
      kind: "DIRECT",
      AND: [
        { members: { some: { userId: userAId } } },
        { members: { some: { userId: userBId } } },
      ],
    },
  });
  if (existing) return existing;

  return prisma.chatChannel.create({
    data: {
      kind: "DIRECT",
      name: "Direct message",
      members: { create: [{ userId: userAId }, { userId: userBId }] },
    },
  });
}

/** Display name for a DM channel from `viewerId`'s perspective: the other person's name. */
export function dmChannelName(
  channel: { members: { user: { firstName: string; lastName: string; id: string } }[] },
  viewerId: string,
): string {
  const other = channel.members.find((m) => m.user.id !== viewerId)?.user;
  return other ? `${other.firstName} ${other.lastName}` : "Direct message";
}

const MESSAGE_PREVIEW_LENGTH = 120;

function truncateBody(body: string): string {
  const trimmed = body.trim();
  return trimmed.length > MESSAGE_PREVIEW_LENGTH ? `${trimmed.slice(0, MESSAGE_PREVIEW_LENGTH).trimEnd()}…` : trimmed;
}

/** Every explicit member of a channel (GROUP or DIRECT), minus the sender. GENERAL has no membership rows — see `isChannelMember`. */
async function otherChannelMemberIds(channelId: string, excludeUserId: string): Promise<string[]> {
  const members = await prisma.chatChannelMember.findMany({
    where: { channelId, userId: { not: excludeUserId } },
    select: { userId: true },
  });
  return members.map((m) => m.userId);
}

/**
 * Pushes a MESSAGES-category notification to the recipients of a newly
 * posted chat message: every other member of a GROUP/DIRECT channel, or
 * every other user of the site for GENERAL (everyone's implicitly in it —
 * same scope `broadcastPush` already covers). The sender is always excluded.
 * `sendPushToUser`/`broadcastPush` already skip anyone who has disabled the
 * MESSAGES category, so there's no separate preference check needed here.
 *
 * Call this inside `after()` from the route handler — same reasoning as the
 * events route: a slow or failing push must never delay the message-send
 * response.
 *
 * Spam/debounce note: this sends one push per message, same as the events
 * flow. A burst of several messages from one sender before anyone reads them
 * currently produces one push each rather than being coalesced. Debouncing
 * would need a delivery window (e.g. "wait N seconds, then send one push
 * covering everything unread") backed by its own state, which is
 * disproportionate for a v1 — left as a possible follow-up.
 */
export async function notifyNewChatMessage(params: {
  channel: { id: string; kind: ChatChannelKind; name: string };
  message: { authorId: string; body: string; parentId: string | null };
  authorName: string;
}) {
  const { channel, message, authorName } = params;

  const title = channel.kind === "DIRECT" ? authorName : `${authorName} in ${channel.name}`;
  const url = `/chat?channel=${channel.id}${message.parentId ? `&thread=${message.parentId}` : ""}`;
  const payload: PushPayload = {
    category: "MESSAGES",
    title,
    body: truncateBody(message.body),
    url,
  };

  if (channel.kind === "GENERAL") {
    await broadcastPush(payload, { excludeUserId: message.authorId });
    return;
  }

  const recipientIds = await otherChannelMemberIds(channel.id, message.authorId);
  await Promise.all(recipientIds.map((userId) => sendPushToUser(userId, payload)));
}
