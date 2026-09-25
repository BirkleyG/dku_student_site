import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isChannelMember } from "@/lib/chat";
import { chatMessageSchema } from "@/lib/chat-validation";
import { awardPoints } from "@/lib/community-score";

type Params = { params: Promise<{ id: string }> };

const authorSelect = { select: { id: true, firstName: true, lastName: true } } as const;

export async function GET(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { id: channelId } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!(await isChannelMember(channelId, user.id))) {
    return NextResponse.json({ error: "Join this group to view it" }, { status: 403 });
  }

  const parentId = new URL(request.url).searchParams.get("parentId");

  if (parentId) {
    const root = await prisma.chatMessage.findUnique({
      where: { id: parentId },
      include: { author: authorSelect },
    });
    if (!root || root.channelId !== channelId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const replies = await prisma.chatMessage.findMany({
      where: { parentId },
      orderBy: { createdAt: "asc" },
      include: { author: authorSelect },
    });
    return NextResponse.json({ root, replies });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { channelId, parentId: null },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { author: authorSelect, _count: { select: { replies: true } } },
  });
  return NextResponse.json({ messages: messages.reverse() });
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to send messages" }, { status: 401 });
  }

  const { id: channelId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const [user, channel] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.chatChannel.findUnique({ where: { id: channelId } }),
  ]);
  if (!user || !channel) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isChannelMember(channelId, user.id))) {
    return NextResponse.json({ error: "Join this group to post in it" }, { status: 403 });
  }

  if (parsed.data.parentId) {
    const parent = await prisma.chatMessage.findUnique({ where: { id: parsed.data.parentId } });
    if (!parent || parent.channelId !== channelId || parent.parentId) {
      return NextResponse.json({ error: "That thread doesn't exist" }, { status: 400 });
    }
  }

  const message = await prisma.chatMessage.create({
    data: {
      channelId,
      authorId: user.id,
      body: parsed.data.body,
      parentId: parsed.data.parentId ?? null,
    },
    include: { author: authorSelect },
  });

  if (channel.kind !== "DIRECT") {
    await awardPoints(user.id, parsed.data.parentId ? "CHAT_REPLY" : "CHAT_MESSAGE");
  }

  return NextResponse.json({ message }, { status: 201 });
}
