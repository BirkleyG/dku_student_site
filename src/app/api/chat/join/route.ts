import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatJoinSchema } from "@/lib/chat-validation";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to join a group" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = chatJoinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const channel = await prisma.chatChannel.findUnique({
    where: { inviteCode: parsed.data.code.trim().toUpperCase() },
  });
  if (!channel || channel.kind !== "GROUP") {
    return NextResponse.json({ error: "That invite code isn't valid" }, { status: 404 });
  }

  await prisma.chatChannelMember.upsert({
    where: { channelId_userId: { channelId: channel.id, userId: user.id } },
    update: {},
    create: { channelId: channel.id, userId: user.id },
  });

  return NextResponse.json({ channel: { id: channel.id, name: channel.name, description: channel.description } });
}
