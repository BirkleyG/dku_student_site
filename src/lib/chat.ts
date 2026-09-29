import type { AdminScope, ChatChannelKind, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
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

/** Cap on how many groups one user may own, to keep group creation from being spammed. */
export const MAX_OWNED_GROUPS = 20;

/**
 * THE one place a chat group gets created (user-created or admin-created).
 * The creator becomes owner (`createdById`) and first member.
 *
 * Points hook: a later points card should award "Start a Group" points from
 * `onChatGroupCreated` below — every creation path goes through here.
 */
export async function createChatGroup(params: { creatorId: string; name: string; description?: string | null }) {
  let inviteCode = generateInviteCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const clash = await prisma.chatChannel.findUnique({ where: { inviteCode } });
    if (!clash) break;
    inviteCode = generateInviteCode();
  }

  const channel = await prisma.chatChannel.create({
    data: {
      kind: "GROUP",
      name: params.name,
      description: params.description ?? null,
      inviteCode,
      createdById: params.creatorId,
      members: { create: [{ userId: params.creatorId }] },
    },
  });

  await onChatGroupCreated({ channelId: channel.id, creatorId: params.creatorId });
  return channel;
}

/** Hook point for "Start a Group" (5 pts, to be wired by the points card). Intentionally a no-op for now; never throws. */
export async function onChatGroupCreated(event: { channelId: string; creatorId: string }): Promise<void> {
  // TODO(points): awardPoints(event.creatorId, "START_GROUP") once that ScoreReason exists.
  void event;
}

type PermissionUser = { id: string; role: Role; adminScopes: AdminScope[] };

/** Group owner (creator) or a CHAT-scope admin may rename/delete/manage members of a GROUP channel. Never applies to GENERAL/DIRECT. */
export function canManageGroup(user: PermissionUser, channel: { kind: ChatChannelKind; createdById: string | null }): boolean {
  if (channel.kind !== "GROUP") return false;
  return channel.createdById === user.id || hasScope(user, "CHAT");
}

/** Sends the invitee a MESSAGES-category push (respects their notification preferences). Call inside `after()`. */
export async function notifyGroupInvite(params: { inviteeId: string; inviterName: string; groupName: string; channelId: string }) {
  await sendPushToUser(params.inviteeId, {
    category: "MESSAGES",
    title: `${params.inviterName} invited you to ${params.groupName}`,
    body: "Open Chat to accept or decline.",
    url: "/chat",
  });
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
