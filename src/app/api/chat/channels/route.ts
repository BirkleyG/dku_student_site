import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { ensureGeneralChannel, createChatGroup, dmChannelName, MAX_OWNED_GROUPS } from "@/lib/chat";
import { chatGroupSchema } from "@/lib/chat-validation";
import { getMentionCounts, getUnreadCounts } from "@/lib/chat-state";

/** Sidebar data: the general channel, the groups this user has joined, and their DMs. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to open Chat" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const general = await ensureGeneralChannel();

  const [groups, dms, invites] = await Promise.all([
    prisma.chatChannel.findMany({
      where: { kind: "GROUP", members: { some: { userId: user.id } } },
      orderBy: { name: "asc" },
    }),
    prisma.chatChannel.findMany({
      where: { kind: "DIRECT", members: { some: { userId: user.id } } },
      include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.chatGroupInvite.findMany({
      where: { inviteeId: user.id, status: "PENDING", channel: { kind: "GROUP" } },
      include: {
        channel: { select: { name: true } },
        inviter: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const [unread, mentions] = await Promise.all([
    getUnreadCounts(user, [general.id, ...groups.map((g) => g.id), ...dms.map((d) => d.id)]),
    getMentionCounts(user.id),
  ]);
  const counts = (id: string) => ({ unread: unread[id] ?? 0, mentions: mentions[id] ?? 0 });

  return NextResponse.json({
    general: { id: general.id, name: general.name, description: general.description, ...counts(general.id) },
    groups: groups.map((g) => ({ id: g.id, name: g.name, description: g.description, ownerId: g.createdById, ...counts(g.id) })),
    invites: invites.map((i) => ({
      id: i.id,
      channelId: i.channelId,
      groupName: i.channel.name,
      inviterName: `${i.inviter.firstName} ${i.inviter.lastName}`,
    })),
    dms: dms.map((d) => ({
      id: d.id,
      name: dmChannelName(d, user.id),
      otherUserId: d.members.find((m) => m.userId !== user.id)?.userId ?? null,
      ...counts(d.id),
    })),
  });
}

/** Any logged-in user creates a new GROUP channel and becomes its owner. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = chatGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const owned = await prisma.chatChannel.count({ where: { kind: "GROUP", createdById: user.id } });
  if (owned >= MAX_OWNED_GROUPS && !hasScope(user, "CHAT")) {
    return NextResponse.json({ error: "You've reached the limit of groups you can own" }, { status: 429 });
  }

  const channel = await createChatGroup({
    creatorId: user.id,
    name: parsed.data.name,
    description: parsed.data.description,
  });

  return NextResponse.json({ channel }, { status: 201 });
}
