import { NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageGroup, notifyGroupInvite } from "@/lib/chat";
import { chatInviteSchema } from "@/lib/chat-validation";

type Params = { params: Promise<{ id: string }> };

/** Owner (or CHAT admin) invites people to a GROUP; each invitee is notified and can accept or decline. */
export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Log in" }, { status: 401 });

  const { id } = await params;
  const [user, channel] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.chatChannel.findUnique({ where: { id } }),
  ]);
  if (!user || !channel || channel.kind !== "GROUP") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageGroup(user, channel)) {
    return NextResponse.json({ error: "Only the group owner can invite people" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = chatInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const userIds = [...new Set(parsed.data.userIds)].filter((uid) => uid !== user.id);
  const [existingUsers, members] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true } }),
    prisma.chatChannelMember.findMany({ where: { channelId: id, userId: { in: userIds } }, select: { userId: true } }),
  ]);
  const memberIds = new Set(members.map((m) => m.userId));
  const inviteeIds = existingUsers.map((u) => u.id).filter((uid) => !memberIds.has(uid));

  for (const inviteeId of inviteeIds) {
    await prisma.chatGroupInvite.upsert({
      where: { channelId_inviteeId: { channelId: id, inviteeId } },
      update: { status: "PENDING", inviterId: user.id },
      create: { channelId: id, inviteeId, inviterId: user.id },
    });
  }

  const inviterName = `${user.firstName} ${user.lastName}`;
  after(async () => {
    await Promise.all(
      inviteeIds.map((inviteeId) =>
        notifyGroupInvite({ inviteeId, inviterName, groupName: channel.name, channelId: id }).catch(() => undefined),
      ),
    );
  });

  return NextResponse.json({ invited: inviteeIds.length }, { status: 201 });
}
