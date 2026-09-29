import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS, achievementKey } from "@/lib/achievements";

export type LeaderboardEntry = { rank: number; userId: string; name: string; points: number; achievements: number };

/**
 * Top N by points. Opt-outs (`showOnLeaderboard = false`) and admin accounts are excluded here on the
 * server, so hidden users can never leak through the client. Names are shown as "First L.".
 */
export async function getLeaderboard(limit = 5): Promise<LeaderboardEntry[]> {
  const users = await prisma.user.findMany({
    where: { showOnLeaderboard: true, role: { not: "ADMIN" }, communityScore: { gt: 0 } },
    orderBy: [{ communityScore: "desc" }, { createdAt: "asc" }],
    take: limit,
    select: { id: true, firstName: true, lastName: true, communityScore: true },
  });
  const counts = await prisma.pointEvent.groupBy({
    by: ["userId"],
    where: { userId: { in: users.map((u) => u.id) }, kind: "ACHIEVEMENT" },
    _count: { _all: true },
  });
  const byUser = new Map(counts.map((c) => [c.userId, c._count._all]));
  return users.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    name: `${u.firstName} ${u.lastName.charAt(0)}.`,
    points: u.communityScore,
    achievements: byUser.get(u.id) ?? 0,
  }));
}

/** Share (0-100, rounded) of all users who have unlocked each achievement, keyed by achievement id. */
export async function getAchievementCompletion(): Promise<Record<string, number>> {
  const [totalUsers, rows] = await Promise.all([
    prisma.user.count(),
    prisma.pointEvent.groupBy({ by: ["key"], where: { kind: "ACHIEVEMENT" }, _count: { _all: true } }),
  ]);
  const byKey = new Map(rows.map((r) => [r.key, r._count._all]));
  return Object.fromEntries(
    ACHIEVEMENTS.map((a) => [a.id, totalUsers === 0 ? 0 : Math.round(((byKey.get(achievementKey(a.id)) ?? 0) / totalUsers) * 100)]),
  );
}
