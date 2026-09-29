import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ show: z.boolean() });

/** Profile toggle "Show me on the leaderboard". Enforced server-side in getLeaderboard(). */
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Log in first" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  await prisma.user.update({ where: { email: session.user.email }, data: { showOnLeaderboard: parsed.data.show } });
  return NextResponse.json({ ok: true });
}
