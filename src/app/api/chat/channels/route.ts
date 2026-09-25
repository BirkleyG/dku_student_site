import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { ensureGeneralChannel, generateInviteCode, dmChannelName } from "@/lib/chat";
import { chatGroupSchema } from "@/lib/chat-validation";

/** Sidebar data: the general channel, the groups this user has joined, and their DMs. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to open Chat" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const general = await ensureGeneralChannel();

  const [groups, dms] = await Promise.all([
    prisma.chatChannel.findMany({
      where: { kind: "GROUP", members: { some: { userId: user.id } } },
      orderBy: { name: "asc" },
    }),
    prisma.chatChannel.findMany({
      where: { kind: "DIRECT", members: { some: { userId: user.id } } },
      include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    general: { id: general.id, name: general.name, description: general.description },
    groups: groups.map((g) => ({ id: g.id, name: g.name, description: g.description })),
    dms: dms.map((d) => ({
      id: d.id,
      name: dmChannelName(d, user.id),
      otherUserId: d.members.find((m) => m.userId !== user.id)?.userId ?? null,
    })),
  });
}

/** Admin (CHAT scope) creates a new GROUP channel with a fresh invite code. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || !hasScope(user, "CHAT")) {
    return NextResponse.json({ error: "You can't create chat groups" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = chatGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  let inviteCode = generateInviteCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const clash = await prisma.chatChannel.findUnique({ where: { inviteCode } });
    if (!clash) break;
    inviteCode = generateInviteCode();
  }

  const channel = await prisma.chatChannel.create({
    data: {
      kind: "GROUP",
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      inviteCode,
      createdById: user.id,
      members: { create: [{ userId: user.id }] },
    },
  });

  return NextResponse.json({ channel }, { status: 201 });
}
