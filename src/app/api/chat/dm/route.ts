import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findOrCreateDmChannel } from "@/lib/chat";
import { chatDmSchema } from "@/lib/chat-validation";

/** Finds or creates the 1:1 DM channel between the caller and another user. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to send a direct message" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = chatDmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const [user, other] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true, firstName: true, lastName: true } }),
  ]);
  if (!user || !other) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (other.id === user.id) return NextResponse.json({ error: "That's you" }, { status: 400 });

  const channel = await findOrCreateDmChannel(user.id, other.id);
  return NextResponse.json({ channel: { id: channel.id, name: `${other.firstName} ${other.lastName}` } }, { status: 201 });
}
