import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordSignal } from "@/lib/points";

/** Called by the client once the welcome tour is completed and the visitor is signed in. Idempotent. */
export async function POST() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Log in first" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await recordSignal(user.id, "TOUR_COMPLETE");
  return NextResponse.json({ ok: true });
}
