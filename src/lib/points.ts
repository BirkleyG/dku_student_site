/**
 * Points ledger (server-only). Replaces the old src/lib/community-score.ts.
 *
 * Model: `PointEvent` rows, unique on (userId, key, refId), so every award is idempotent:
 *  - ACTIVITY rows: `key` is an ActivityKey (see points-rules.ts), `refId` the object it was earned on
 *    (event id, recommendation id, ...). Un-doing then redoing the same action hits the same row -> no farm.
 *  - ACHIEVEMENT rows: `key` is "ACH:<id>", one-time.
 *  - SIGNAL rows: zero-point facts achievements depend on (tour done, first widget, night owl ...).
 * `User.communityScore` is a cached SUM(points), kept in sync here.
 * Deleting the *object* (post, event ...) calls `revokePoints`, so create/delete/create can't farm either.
 * Achievement bonuses are never revoked.
 *
 * Helpers for other features (e.g. the Profile "Semester in Review" / Wrapped):
 *   getUserPointsSummary(userId, { from?, to? }) -> { total, sources: [{ source, label, points, count, items: [{ key, label, count, points }] }] }
 *   getUnlockedAchievements(userId, { from?, to? }) -> [{ id, name, emoji, points, unlockedAt, ... }] (newest first)
 *   getAchievementProgress(userId) -> every achievement with unlocked/unlockedAt
 *   getRecentPointEvents(userId, limit)
 * All range args are optional Dates (from inclusive, to exclusive).
 */
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID, achievementKey, isAchievementKey, type AchievementDef } from "@/lib/achievements";
import {
  ACTIVITY_RULES,
  POINT_SOURCES,
  SOURCE_LABELS,
  isActivityKey,
  type ActivityKey,
  type PointSource,
  type SignalKey,
} from "@/lib/points-rules";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Inserts a ledger row if new. Returns true only when this call created it. */
async function grant(tx: Tx, userId: string, key: string, kind: "ACTIVITY" | "ACHIEVEMENT" | "SIGNAL", points: number, refId: string) {
  const res = await tx.pointEvent.createMany({ data: [{ userId, key, kind, points, refId }], skipDuplicates: true });
  if (res.count === 0) return false;
  if (points !== 0) await tx.user.update({ where: { id: userId }, data: { communityScore: { increment: points } } });
  return true;
}

/** Hour of day on campus (Asia/Shanghai) plus the yyyy-mm-dd campus date. */
function campusNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { hour: Number(get("hour")) % 24, date: `${get("year")}-${get("month")}-${get("day")}` };
}

export type AwardResult = { awarded: boolean; points: number; unlocked: string[] };
const NOTHING: AwardResult = { awarded: false, points: 0, unlocked: [] };

/**
 * Award activity points. Idempotent per (userId, key, refId); never throws (safe to await after the
 * main write succeeded). Also records night-owl/early-bird signals and unlocks any achievements earned.
 */
export async function awardPoints(userId: string, key: ActivityKey, refId = ""): Promise<AwardResult> {
  try {
    const rule = ACTIVITY_RULES[key] as { points: number; dailyCap?: number };
    if (rule.dailyCap) {
      const recent = await prisma.pointEvent.count({ where: { userId, key, createdAt: { gte: new Date(Date.now() - DAY_MS) } } });
      if (recent >= rule.dailyCap) return NOTHING;
    }
    const created = await prisma.$transaction((tx) => grant(tx, userId, key, "ACTIVITY", rule.points, refId));
    if (!created) return NOTHING;
    await recordTimeOfDay(userId);
    const unlocked = await evaluateAchievements(userId);
    return { awarded: true, points: rule.points, unlocked };
  } catch (err) {
    console.error("awardPoints failed:", err);
    return NOTHING;
  }
}

/** Records a zero-point signal (achievement fuel) and unlocks anything it completes. Idempotent, never throws. */
export async function recordSignal(userId: string, key: SignalKey, refId = ""): Promise<AwardResult> {
  try {
    const created = await prisma.$transaction((tx) => grant(tx, userId, key, "SIGNAL", 0, refId));
    if (!created) return NOTHING;
    const unlocked = await evaluateAchievements(userId);
    return { awarded: true, points: 0, unlocked };
  } catch (err) {
    console.error("recordSignal failed:", err);
    return NOTHING;
  }
}

async function recordTimeOfDay(userId: string) {
  const { hour, date } = campusNow();
  const key = hour < 5 ? "NIGHT_OWL" : hour < 7 ? "EARLY_BIRD" : null;
  if (!key) return;
  await prisma.$transaction((tx) => grant(tx, userId, key, "SIGNAL", 0, date));
}

/**
 * Take back the points for an object that was deleted, so create -> delete -> create can't farm.
 * Only ACTIVITY rows; achievement bonuses stay. Never throws.
 */
export async function revokePoints(userId: string, key: ActivityKey, refId = ""): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      const row = await tx.pointEvent.findUnique({ where: { userId_key_refId: { userId, key, refId } } });
      if (!row || row.kind !== "ACTIVITY") return;
      await tx.pointEvent.delete({ where: { id: row.id } });
      if (row.points !== 0) await tx.user.update({ where: { id: userId }, data: { communityScore: { decrement: row.points } } });
    });
  } catch (err) {
    console.error("revokePoints failed:", err);
  }
}

type Stats = { counts: Map<string, number>; total: number; achievements: number; sources: number };

async function loadStats(userId: string): Promise<Stats> {
  const rows = await prisma.pointEvent.groupBy({ by: ["key"], where: { userId }, _count: { _all: true }, _sum: { points: true } });
  const counts = new Map<string, number>();
  let total = 0;
  let achievements = 0;
  const sources = new Set<PointSource>();
  for (const r of rows) {
    counts.set(r.key, r._count._all);
    total += r._sum.points ?? 0;
    if (isAchievementKey(r.key)) achievements += r._count._all;
    else if (isActivityKey(r.key)) sources.add(ACTIVITY_RULES[r.key].source);
  }
  return { counts, total, achievements, sources: sources.size };
}

function conditionMet(def: AchievementDef, s: Stats): boolean {
  const w = def.when;
  switch (w.kind) {
    case "count":
      return w.keys.reduce((n, k) => n + (s.counts.get(k) ?? 0), 0) >= w.n;
    case "sources":
      return s.sources >= w.n;
    case "total":
      return s.total >= w.n;
    case "achievements":
      return s.achievements >= w.n;
  }
}

/** Unlocks every achievement whose condition is met (each pays its points once). Returns newly unlocked ids. */
export async function evaluateAchievements(userId: string): Promise<string[]> {
  const unlocked: string[] = [];
  // Achievement bonuses can complete total/count-of-achievement achievements, so loop to a fixpoint.
  for (let round = 0; round < 5; round++) {
    const stats = await loadStats(userId);
    const fresh = ACHIEVEMENTS.filter((a) => !stats.counts.has(achievementKey(a.id)) && conditionMet(a, stats));
    if (fresh.length === 0) break;
    let granted = 0;
    for (const a of fresh) {
      const created = await prisma.$transaction((tx) => grant(tx, userId, achievementKey(a.id), "ACHIEVEMENT", a.points, ""));
      if (created) {
        unlocked.push(a.id);
        granted++;
      }
    }
    if (granted === 0) break;
  }
  return unlocked;
}

export type DateRange = { from?: Date; to?: Date };
const rangeWhere = (r?: DateRange) => (r && (r.from || r.to) ? { createdAt: { ...(r.from ? { gte: r.from } : {}), ...(r.to ? { lt: r.to } : {}) } } : {});

export type PointsSummaryItem = { key: string; label: string; labelZh: string; count: number; points: number };
export type PointsSummarySource = { source: PointSource; label: string; labelZh: string; points: number; count: number; items: PointsSummaryItem[] };
export type PointsSummary = { total: number; sources: PointsSummarySource[] };

/** Total points and a per-source breakdown (activities grouped by source, plus an "Achievements" source) for an optional date range. */
export async function getUserPointsSummary(userId: string, range?: DateRange): Promise<PointsSummary> {
  const rows = await prisma.pointEvent.groupBy({
    by: ["key"],
    where: { userId, kind: { not: "SIGNAL" }, ...rangeWhere(range) },
    _count: { _all: true },
    _sum: { points: true },
  });
  const bySource = new Map<PointSource, PointsSummarySource>();
  const ensure = (source: PointSource) => {
    let s = bySource.get(source);
    if (!s) {
      s = { source, label: SOURCE_LABELS[source].en, labelZh: SOURCE_LABELS[source].zh, points: 0, count: 0, items: [] };
      bySource.set(source, s);
    }
    return s;
  };
  let total = 0;
  for (const r of rows) {
    const points = r._sum.points ?? 0;
    const count = r._count._all;
    total += points;
    if (isActivityKey(r.key)) {
      const rule = ACTIVITY_RULES[r.key];
      const s = ensure(rule.source);
      s.points += points;
      s.count += count;
      s.items.push({ key: r.key, label: rule.label, labelZh: rule.labelZh, count, points });
    } else if (isAchievementKey(r.key)) {
      const s = ensure("ACHIEVEMENTS");
      s.points += points;
      s.count += count;
    }
  }
  const sources = POINT_SOURCES.filter((p) => bySource.has(p)).map((p) => bySource.get(p)!);
  return { total, sources };
}

export type UnlockedAchievement = AchievementDef & { unlockedAt: Date };

/** Achievements unlocked in an optional date range, newest first. */
export async function getUnlockedAchievements(userId: string, range?: DateRange): Promise<UnlockedAchievement[]> {
  const rows = await prisma.pointEvent.findMany({
    where: { userId, kind: "ACHIEVEMENT", ...rangeWhere(range) },
    orderBy: { createdAt: "desc" },
  });
  return rows.flatMap((r) => {
    const def = ACHIEVEMENT_BY_ID[r.key.slice(4)];
    return def ? [{ ...def, unlockedAt: r.createdAt }] : [];
  });
}

/** Every achievement in the catalog with the user's unlock date (null if locked). */
export async function getAchievementProgress(userId: string): Promise<(AchievementDef & { unlockedAt: Date | null })[]> {
  const rows = await prisma.pointEvent.findMany({ where: { userId, kind: "ACHIEVEMENT" }, select: { key: true, createdAt: true } });
  const at = new Map(rows.map((r) => [r.key, r.createdAt]));
  return ACHIEVEMENTS.map((a) => ({ ...a, unlockedAt: at.get(achievementKey(a.id)) ?? null }));
}

/** Newest ledger rows that paid points (activities and achievements). */
export async function getRecentPointEvents(userId: string, limit = 20) {
  return prisma.pointEvent.findMany({
    where: { userId, kind: { not: "SIGNAL" } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
