import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";
import { hasScope } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

/** Author or a CHAT-scoped admin can take an announcement down. */
export async function DELETE(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Log in first" }, { status: 401 });

  const { id } = await params;
  const announcement = await prisma.announcement.findUnique({ where: { id }, select: { authorId: true } });
  if (!announcement) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (announcement.authorId !== user.id && !hasScope(user, "CHAT")) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
