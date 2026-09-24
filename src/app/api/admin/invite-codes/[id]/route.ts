import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const requester = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!requester || requester.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can revoke invite codes" }, { status: 403 });
  }

  const { id } = await params;
  const invite = await prisma.inviteCode.findUnique({ where: { id } });
  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invite.usedAt) {
    return NextResponse.json({ error: "That code has already been used" }, { status: 400 });
  }

  await prisma.inviteCode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
