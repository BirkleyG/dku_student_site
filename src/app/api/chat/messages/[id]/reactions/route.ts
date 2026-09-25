import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isChannelMember } from "@/lib/chat";
import { REACTION_EMOJI } from "@/lib/chat-reactions";

type Params = { params: Promise<{ id: string }> };

const reactionSchema = z.object({ emoji: z.enum(REACTION_EMOJI) });

/** Toggles the caller's reaction with this emoji on this message: adds it if absent, removes it if already there. */
export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to react" }, { status: 401 });
  }

  const { id: messageId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  }

  const [user, message] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.chatMessage.findUnique({ where: { id: messageId } }),
  ]);
  if (!user || !message) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isChannelMember(message.channelId, user.id))) {
    return NextResponse.json({ error: "Join this group to react" }, { status: 403 });
  }

  const existing = await prisma.chatMessageReaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId: user.id, emoji: parsed.data.emoji } },
  });

  if (existing) {
    await prisma.chatMessageReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.chatMessageReaction.create({
      data: { messageId, userId: user.id, emoji: parsed.data.emoji },
    });
  }

  const reactions = await prisma.chatMessageReaction.findMany({ where: { messageId } });
  return NextResponse.json({ reactions });
}
