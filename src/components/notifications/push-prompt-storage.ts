/**
 * Anti-nag bookkeeping for the push-permission prompt, kept in localStorage
 * (per device, same pattern as WelcomeModal's dismissed flag) rather than the
 * User model — this is UI noise-control state, not something that needs to
 * sync across devices or be visible anywhere else.
 *
 * Policy (see the PR description for the reasoning): ask again only after a
 * 14-day cooldown from the last dismissal, and never more than 3 times total.
 * Combining a cooldown with a hard cap means an occasional user isn't nagged
 * every session forever, but a user who's said "not now" three times across
 * a month+ is left alone for good — they can still turn notifications on
 * anytime from Settings.
 */

const STORAGE_KEY = "dku-life:push-prompt-dismissals";
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const MAX_ASKS = 3;

type DismissRecord = { count: number; lastDismissedAt: number };

function readRecord(): DismissRecord {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, lastDismissedAt: 0 };
    const parsed = JSON.parse(raw) as Partial<DismissRecord>;
    return {
      count: typeof parsed.count === "number" ? parsed.count : 0,
      lastDismissedAt: typeof parsed.lastDismissedAt === "number" ? parsed.lastDismissedAt : 0,
    };
  } catch {
    return { count: 0, lastDismissedAt: 0 };
  }
}

/** Called when the user dismisses/declines the prompt (✕, "Not now", or Esc). */
export function recordPushPromptDismissal() {
  try {
    const current = readRecord();
    const next: DismissRecord = { count: current.count + 1, lastDismissedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode / blocked storage: worst case we ask again next time.
  }
}

/**
 * Whether the anti-nag policy allows showing the prompt right now. This only
 * covers the "have we annoyed this person too much" question — callers must
 * separately confirm the user isn't already subscribed (or unsubscribed on
 * purpose) via `usePushSubscription().state`.
 */
export function canAskForPushPromptAgain(): boolean {
  const record = readRecord();
  if (record.count >= MAX_ASKS) return false;
  if (record.count > 0 && Date.now() - record.lastDismissedAt < COOLDOWN_MS) return false;
  return true;
}

/**
 * The hard browser-level gate: once the user has answered the native
 * permission dialog (either way), we must never ask again — a "denied" user
 * re-prompted is exactly the nag pattern this feature exists to avoid, and a
 * "granted" user has nothing left to ask for.
 */
export function isNotificationPermissionDecided(): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) return true;
  return Notification.permission !== "default";
}
