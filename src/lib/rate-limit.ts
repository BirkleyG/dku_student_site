// A minimal in-memory rate limiter for the invite-code step of signup.
//
// This is intentionally simple: a Map keyed by an identifier (e.g. client
// IP), tracking a rolling count of failures within a fixed window. It is
// NOT shared across server instances and resets whenever the process
// restarts or redeploys — fine for slowing down casual brute-forcing of
// invite codes, but not a substitute for a real distributed rate limiter
// (e.g. Redis-backed) if this app ever runs multi-instance.

type Bucket = {
  count: number;
  windowStart: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitConfig = {
  windowMs: number;
  maxFailures: number;
};

export const INVITE_CODE_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxFailures: 10,
};

/** Returns true if `key` has already hit the failure cap for the current window. */
export function isRateLimited(
  key: string,
  config: RateLimitConfig = INVITE_CODE_RATE_LIMIT,
  now: number = Date.now(),
): boolean {
  const bucket = buckets.get(key);
  if (!bucket) return false;
  if (now - bucket.windowStart > config.windowMs) {
    buckets.delete(key);
    return false;
  }
  return bucket.count >= config.maxFailures;
}

/** Records one failed attempt for `key`, starting a fresh window if the old one expired. */
export function recordFailure(
  key: string,
  config: RateLimitConfig = INVITE_CODE_RATE_LIMIT,
  now: number = Date.now(),
): void {
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart > config.windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return;
  }
  bucket.count += 1;
}

/** Test-only escape hatch to reset all tracked buckets between test cases. */
export function __resetRateLimitsForTests(): void {
  buckets.clear();
}

/**
 * Best-effort client identifier for rate limiting, derived from proxy
 * headers. Falls back to a constant so requests without any forwarding
 * headers (e.g. local dev) still share a single bucket rather than bypassing
 * the limiter entirely.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
