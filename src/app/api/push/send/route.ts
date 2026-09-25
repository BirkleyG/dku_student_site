import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

const sendSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(500),
  url: z.string().trim().max(500).optional(),
  category: z.enum(["EVENTS", "MESSAGES", "RECOMMENDATIONS", "ORDERS"]).default("EVENTS"),
});

/**
 * Admin-only manual send, so the delivery pipeline (subscribe -> send ->
 * retry/prune) can be exercised end-to-end without waiting for a real
 * trigger to fire. Sends only to the calling admin's own subscriptions.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const result = await sendPushToUser(user.id, parsed.data);
  return NextResponse.json(result);
}
