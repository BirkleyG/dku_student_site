import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageGroup, isChannelMember } from "@/lib/chat";

type Params = { params: Promise<{ id: string }> };

/** Members of a GROUP the caller belongs to, plus (for owners) pending invites. */
export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Log in" }, { status: 401 });

  const { id } = await params;
  const [user, channel] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.chatChannel.findUnique({ where: { id } }),
  ]);
  if (!user || !channel || channel.kind !== "GROUP") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isChannelMember(id, user.id))) return NextResponse.json({ error: "Join this group to view it" }, { status: 403 });

  const userSelect = { select: { id: true, firstName: true, lastName: true } } as const;
  const canManage = canManageGroup(user, channel);
  const [members, pending] = await Promise.all([
    prisma.chatChannelMember.findMany({ where: { channelId: id }, include: { user: userSelect }, orderBy: { joinedAt: "asc" } }),
    canManage
      ? prisma.chatGroupInvite.findMany({ where: { channelId: id, status: "PENDING" }, include: { invitee: userSelect } })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    ownerId: channel.createdById,
    canManage,
    members: members.map((m) => m.user),
    pendingInvites: pending.map((i) => ({ id: i.id, user: i.invitee })),
  });
}

/** Owner (or CHAT admin) removes a member; any member may remove themselves (leave). Body: { userId }. */
export async function DELETE(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Log in" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { userId?: unknown } | null;
  const targetId = typeof body?.userId === "string" ? body.userId : null;
  if (!targetId) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const [user, channel] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.chatChannel.findUnique({ where: { id } }),
  ]);
  if (!user || !channel || channel.kind !== "GROUP") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isSelf = targetId === user.id;
  if (!isSelf && !canManageGroup(user, channel)) {
    return NextResponse.json({ error: "Only the group owner can remove members" }, { status: 403 });
  }
  if (targetId === channel.createdById) {
    return NextResponse.json({ error: "The owner can't be removed — delete the group instead" }, { status: 400 });
  }

  await prisma.chatChannelMember.deleteMany({ where: { channelId: id, userId: targetId } });
  // Forget any old accepted invite so the person can be invited again later.
  await prisma.chatGroupInvite.deleteMany({ where: { channelId: id, inviteeId: targetId } });
  return NextResponse.json({ ok: true });
}
