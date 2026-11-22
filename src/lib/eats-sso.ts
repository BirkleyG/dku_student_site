import { createHmac, randomBytes } from "node:crypto";

// DKU Eats (birkleyg/eats, v2: Hono API + Postgres on Railway) and DKU Life
// share one secret: EATS_SHARED_SECRET here, DKU_LIFE_SECRET on the Eats API.
// It signs one-tap sign-in tokens and authenticates server-to-server calls.

/** Base URL of the DKU Eats API (the Railway service), without a trailing slash. */
export function eatsApiUrl(): string | null {
  const url = process.env.EATS_API_URL?.trim();
  return url ? url.replace(/\/$/, "") : null;
}

function sharedSecret(): string | null {
  const secret = process.env.EATS_SHARED_SECRET ?? "";
  return secret.length >= 16 ? secret : null;
}

/** True when DKU Life can read public DKU Eats data (open kitchens, calendar). */
export function isEatsConfigured(): boolean {
  return eatsApiUrl() !== null;
}

/** True when DKU Life can also sign people in and read per-person data (orders, shops, managers). */
export function isEatsLinked(): boolean {
  return isEatsConfigured() && sharedSecret() !== null;
}

export function eatsServerAuthHeader(): Record<string, string> {
  const secret = sharedSecret();
  return secret ? { Authorization: `Bearer ${secret}` } : {};
}

/**
 * A one-time, two-minute sign-in token for DKU Eats, passed to the embed as
 * `?dkulife=`. DKU Eats checks the signature and that the nonce is unused.
 * Format: v1.<base64url(JSON)>.<base64url(HMAC-SHA256(secret, "v1." + JSON part))>
 */
export function signEatsSsoToken(user: { netId: string; name: string }): string {
  const secret = sharedSecret();
  if (!secret) throw new Error("DKU Eats sign-in isn't configured (EATS_SHARED_SECRET)");
  const payload = Buffer.from(
    JSON.stringify({
      netid: user.netId.toLowerCase(),
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + 120,
      nonce: randomBytes(16).toString("base64url"),
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret).update(`v1.${payload}`).digest("base64url");
  return `v1.${payload}.${signature}`;
}
