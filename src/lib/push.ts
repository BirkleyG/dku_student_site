import webpush from "web-push";
import type { NotificationCategory, PushSubscription as StoredSubscription } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:noreply@dukekunshan.edu.cn";

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

/** Safe to expose to the client — pairs with the private key kept server-side only. */
export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY ?? null;
}

export type PushPayload = {
  category: NotificationCategory;
  title: string;
  body: string;
  /** Relative path the notification click should open, e.g. "/events/abc123". */
  url?: string;
};

const RETRY_DELAYS_MS = [500, 2000, 5000];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends one push message to one subscription, retrying transient failures
 * with backoff. A 404/410 means the push service has permanently discarded
 * this subscription (browser uninstalled the app, cleared storage, etc.) —
 * that's not a failure to retry, it's a signal to prune it so we stop
 * wasting sends on a dead endpoint.
 */
async function sendToSubscription(sub: StoredSubscription, payload: PushPayload) {
  if (!ensureConfigured()) {
    throw new Error("VAPID keys are not configured (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)");
  }

  const message = JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? "/" });
  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  };

  let attempts = 0;
  let lastError: unknown;

  for (let i = 0; i <= RETRY_DELAYS_MS.length; i++) {
    attempts++;
    try {
      await webpush.sendNotification(pushSubscription, message);
      await prisma.pushDelivery.create({
        data: {
          category: payload.category,
          title: payload.title,
          body: payload.body,
          url: payload.url,
          userId: sub.userId,
          subscriptionId: sub.id,
          status: "SENT",
          attempts,
        },
      });
      return { ok: true as const };
    } catch (error) {
      lastError = error;
      const statusCode = (error as { statusCode?: number })?.statusCode;

      // Dead subscription — the push service will never accept this endpoint
      // again. Prune it immediately instead of burning retries on it.
      if (statusCode === 404 || statusCode === 410) {
        // The subscription row may already be gone (e.g. a concurrent
        // unsubscribe) — deleteMany is a no-op instead of throwing in that case.
        await prisma.pushSubscription.deleteMany({ where: { id: sub.id } });
        await prisma.pushDelivery.create({
          data: {
            category: payload.category,
            title: payload.title,
            body: payload.body,
            url: payload.url,
            userId: sub.userId,
            subscriptionId: null,
            status: "PRUNED",
            attempts,
            lastError: `HTTP ${statusCode}: subscription expired, pruned`,
          },
        });
        return { ok: false as const, pruned: true as const };
      }

      // Any other error (5xx from the push service, network blip, etc.) is
      // worth retrying with backoff before giving up.
      if (i < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[i]);
      }
    }
  }

  const message2 = lastError instanceof Error ? lastError.message : String(lastError);
  await prisma.pushDelivery.create({
    data: {
      category: payload.category,
      title: payload.title,
      body: payload.body,
      url: payload.url,
      userId: sub.userId,
      subscriptionId: sub.id,
      status: "FAILED",
      attempts,
      lastError: message2.slice(0, 1000),
    },
  });
  return { ok: false as const, pruned: false as const };
}

/** Sends a push notification to every subscription a single user has registered. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  const results = await Promise.all(subs.map((sub) => sendToSubscription(sub, payload)));
  return {
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok && !("pruned" in r && r.pruned)).length,
    pruned: results.filter((r) => "pruned" in r && r.pruned).length,
  };
}

/**
 * Sends a push notification to every user who has at least one subscription.
 * v1 has no per-category opt-out yet (that's the separate preferences card) —
 * this is the "send everything" default the card calls for. `excludeUserId`
 * skips notifying the actor who caused the event (e.g. the event's own host).
 */
export async function broadcastPush(payload: PushPayload, options?: { excludeUserId?: string }) {
  const subs = await prisma.pushSubscription.findMany({
    where: options?.excludeUserId ? { userId: { not: options.excludeUserId } } : undefined,
  });

  const results = await Promise.all(subs.map((sub) => sendToSubscription(sub, payload)));
  return {
    recipients: new Set(subs.map((s) => s.userId)).size,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok && !("pruned" in r && r.pruned)).length,
    pruned: results.filter((r) => "pruned" in r && r.pruned).length,
  };
}
