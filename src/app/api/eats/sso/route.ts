import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEatsLinked, signEatsSsoToken } from "@/lib/eats-sso";

/** A one-time sign-in token for the DKU Eats embed (see src/lib/eats-sso.ts). */
export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in first" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!user.netId) return NextResponse.json({ error: "Your account has no NetID" }, { status: 409 });
  if (!isEatsLinked()) return NextResponse.json({ error: "DKU Eats sign-in isn't set up yet" }, { status: 503 });

  return NextResponse.json({ token: signEatsSsoToken({ netId: user.netId, name: `${user.firstName} ${user.lastName}`.trim() }) });
}
