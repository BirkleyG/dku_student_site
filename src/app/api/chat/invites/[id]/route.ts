import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatInviteResponseSchema } from "@/lib/chat-validation";

type Params = { params: Promise<{ id: string }> };

/** The invitee accepts (joins the group) or declines a pending invite. Only the invitee may respond. */
export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Log in" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = chatInviteResponseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { id } = await params;
  const [user, invite] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.chatGroupInvite.findUnique({ where: { id }, include: { channel: true } }),
  ]);
  if (!user || !invite || invite.inviteeId !== user.id || invite.channel.kind !== "GROUP") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (invite.status !== "PENDING") {
    return NextResponse.json({ error: "That invite was already answered" }, { status: 409 });
  }

  if (parsed.data.action === "accept") {
    await prisma.$transaction([
      prisma.chatChannelMember.upsert({
        where: { channelId_userId: { channelId: invite.channelId, userId: user.id } },
        update: {},
        create: { channelId: invite.channelId, userId: user.id },
      }),
      prisma.chatGroupInvite.update({ where: { id }, data: { status: "ACCEPTED" } }),
    ]);
    return NextResponse.json({
      channel: { id: invite.channel.id, name: invite.channel.name, description: invite.channel.description },
    });
  }

  await prisma.chatGroupInvite.update({ where: { id }, data: { status: "DECLINED" } });
  return NextResponse.json({ ok: true });
}
