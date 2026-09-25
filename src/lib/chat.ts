import { prisma } from "@/lib/prisma";

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
