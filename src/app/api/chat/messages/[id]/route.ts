import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { id } = await params;
  const [user, message] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.chatMessage.findUnique({ where: { id } }),
  ]);
  if (!user || !message) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (message.authorId !== user.id && !hasScope(user, "CHAT")) {
    return NextResponse.json({ error: "You can't remove this message" }, { status: 403 });
  }

  await prisma.chatMessage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
