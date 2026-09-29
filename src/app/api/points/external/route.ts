import { NextResponse } from "next/server";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";
import { EXTERNAL_KEYS, type ActivityKey } from "@/lib/points-rules";

/**
 * Webhook for apps that live outside this codebase (DKU Eats, the Marketplace) to report an
 * activity for a DKU Life user: EATS_ORDER, EATS_RUN_RESTAURANT, MARKET_SELL, MARKET_BUY.
 *
 *   POST /api/points/external
 *   Authorization: Bearer $POINTS_WEBHOOK_SECRET
 *   { "userId": "<DKU Life user id>", "key": "MARKET_SELL", "refId": "<order/listing id>" }
 *
 * Idempotent per (userId, key, refId). Disabled (503) until POINTS_WEBHOOK_SECRET is set.
 */
const bodySchema = z.object({
  userId: z.string().min(1),
  key: z.string().refine((k): k is ActivityKey => (EXTERNAL_KEYS as string[]).includes(k), "Unsupported key"),
  refId: z.string().min(1).max(200),
});

function secretMatches(header: string | null, secret: string): boolean {
  const given = Buffer.from((header ?? "").replace(/^Bearer\s+/i, ""));
  const want = Buffer.from(secret);
  return given.length === want.length && timingSafeEqual(given, want);
}

export async function POST(request: Request) {
  const secret = process.env.POINTS_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Points webhook isn't configured" }, { status: 503 });
  if (!secretMatches(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unknown user" }, { status: 404 });

  const result = await awardPoints(user.id, parsed.data.key as ActivityKey, parsed.data.refId);
  return NextResponse.json({ ok: true, awarded: result.awarded });
}
