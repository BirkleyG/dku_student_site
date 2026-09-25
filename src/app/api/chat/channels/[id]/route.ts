import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { isChannelMember, dmChannelName } from "@/lib/chat";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { id } = await params;
  const [user, channel] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.chatChannel.findUnique({
      where: { id },
      include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
    }),
  ]);
  if (!user || !channel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await isChannelMember(id, user.id);
  if (!member) return NextResponse.json({ error: "Join this group to view it" }, { status: 403 });

  return NextResponse.json({
    channel: {
      id: channel.id,
      kind: channel.kind,
      name: channel.kind === "DIRECT" ? dmChannelName(channel, user.id) : channel.name,
      description: channel.description,
      inviteCode: channel.inviteCode,
    },
  });
}

/** Admin (CHAT scope) deletes a GROUP channel. General and DMs can't be deleted this way. */
export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { id } = await params;
  const [user, channel] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.chatChannel.findUnique({ where: { id } }),
  ]);
  if (!user || !channel) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (channel.kind !== "GROUP" || !hasScope(user, "CHAT")) {
    return NextResponse.json({ error: "You can't remove this channel" }, { status: 403 });
  }

  await prisma.chatChannel.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
