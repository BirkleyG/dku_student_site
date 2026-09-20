import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mintEatsSsoToken } from "@/lib/eats-sso";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in first" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const token = await mintEatsSsoToken(user.id);
    return NextResponse.json({
      token,
      name: `${user.firstName} ${user.lastName}`,
      netId: user.netId ?? "",
      email: user.email,
    });
  } catch (err) {
    console.error("DKU Eats SSO mint failed:", err);
    return NextResponse.json({ error: "DKU Eats sign-in isn't set up yet" }, { status: 503 });
  }
}
