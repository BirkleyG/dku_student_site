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
  const [user, topic] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.wisdomTopic.findUnique({ where: { id } }),
  ]);

  if (!user || !topic) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (topic.createdById !== user.id && !hasScope(user, "WISDOM")) {
    return NextResponse.json({ error: "You can't remove this topic" }, { status: 403 });
  }

  await prisma.wisdomTopic.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
