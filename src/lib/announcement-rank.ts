/**
 * Announcement Board ranking.
 *
 * Three guarantees, in this order:
 *  1. Every new announcement is shown for at least GRACE_HOURS, whatever its votes, so a post
 *     gets seen before the crowd can bury it. (Admins can still delete abuse.)
 *  2. Each announcement has a lifetime that votes stretch or shrink:
 *       lifetime = BASE_HOURS + net * HOURS_PER_VOTE, clamped to [GRACE_HOURS, MAX_HOURS]
 *     so +10 net keeps a post up ~13 days, -2 net pulls it down right after the grace window.
 *  3. Among visible posts, order is a "hot" score: net votes decayed by age, with a bonus
 *     for posts still inside their grace window so they sit near the top while fresh.
 *
 * Pure functions only: the API sorts with these and the test script checks them.
 */

export const GRACE_HOURS = 12;
export const BASE_HOURS = 72;
export const HOURS_PER_VOTE = 24;
export const MAX_HOURS = 24 * 30;
const HOUR = 3_600_000;

export type VoteTally = { up: number; down: number };
export type RankInput = { createdAt: Date; up: number; down: number };

export function netScore({ up, down }: VoteTally) {
  return up - down;
}

/** How long (hours) the post stays on the board. Never below the grace window. */
export function lifetimeHours(tally: VoteTally) {
  const raw = BASE_HOURS + netScore(tally) * HOURS_PER_VOTE;
  return Math.min(MAX_HOURS, Math.max(GRACE_HOURS, raw));
}

export function ageHours(createdAt: Date, now: Date) {
  return Math.max(0, (now.getTime() - createdAt.getTime()) / HOUR);
}

export function isVisible(a: RankInput, now: Date) {
  return ageHours(a.createdAt, now) < lifetimeHours(a);
}

export function expiresAt(a: RankInput) {
  return new Date(a.createdAt.getTime() + lifetimeHours(a) * HOUR);
}

/** Higher is better. HN-style decay; fresh posts get a +3 head start that fades over the grace window. */
export function hotScore(a: RankInput, now: Date) {
  const age = ageHours(a.createdAt, now);
  const freshBonus = age < GRACE_HOURS ? 3 * (1 - age / GRACE_HOURS) : 0;
  return (netScore(a) + 1 + freshBonus) / Math.pow(age + 2, 1.4);
}

export function rankAnnouncements<T extends RankInput>(items: T[], now: Date): T[] {
  return items
    .filter((a) => isVisible(a, now))
    .map((a) => ({ a, s: hotScore(a, now) }))
    .sort((x, y) => y.s - x.s || y.a.createdAt.getTime() - x.a.createdAt.getTime())
    .map(({ a }) => a);
}

export function tally(votes: { value: number }[]): VoteTally {
  let up = 0;
  let down = 0;
  for (const v of votes) {
    if (v.value > 0) up++;
    else if (v.value < 0) down++;
  }
  return { up, down };
}
