import { formatDistanceToNow } from "date-fns";
import { Award, Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { getServerLocale, getT } from "@/lib/i18n/server";
import { getAchievementProgress, getRecentPointEvents, getUserPointsSummary } from "@/lib/points";
import { ACHIEVEMENT_BY_ID, isAchievementKey } from "@/lib/achievements";
import { ACTIVITY_RULES, isActivityKey } from "@/lib/points-rules";
import { getAchievementCompletion, getLeaderboard } from "@/lib/leaderboard";
import { LeaderboardToggle } from "@/components/profile/LeaderboardToggle";

/**
 * Profile "points" block: total + rank, per-source breakdown, achievement grid and recent activity.
 * Self-contained server component so the shared profile page only needs `<PointsSection userId=... />`.
 */
export async function PointsSection({ userId }: { userId: string }) {
  const t = await getT("profile");
  const locale = await getServerLocale();
  const zh = locale === "zh";

  const [me, summary, achievements, recent, leaderboard, completion] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { communityScore: true, showOnLeaderboard: true } }),
    getUserPointsSummary(userId),
    getAchievementProgress(userId),
    getRecentPointEvents(userId, 15),
    getLeaderboard(5),
    getAchievementCompletion(),
  ]);
  const score = me?.communityScore ?? summary.total;
  const rank = await prisma.user.count({ where: { communityScore: { gt: score } } });
  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  const eventLabel = (key: string) => {
    if (isAchievementKey(key)) {
      const def = ACHIEVEMENT_BY_ID[key.slice(4)];
      return def ? `${def.emoji} ${zh ? def.nameZh : def.name}` : key;
    }
    if (isActivityKey(key)) return zh ? ACTIVITY_RULES[key].labelZh : ACTIVITY_RULES[key].label;
    return key;
  };

  return (
    <>
      <Reveal delay={0.1} className="mt-8">
        <Card className="flex items-center gap-5">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-bright">
            <Award className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-ink/45">{t("communityScore")}</p>
            <p className="mt-1 font-display text-4xl">{score}</p>
            <p className="mt-1 text-sm text-ink/50">{t("rankOnCampus", { rank: rank + 1 })}</p>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.12} className="mt-8">
        <h2 className="font-display text-xl">{t("leaderboard")}</h2>
        {leaderboard.length === 0 ? (
          <p className="mt-4 text-sm text-ink/40">{t("leaderboardEmpty")}</p>
        ) : (
          <ol className="mt-4 space-y-2">
            {leaderboard.map((e) => (
              <li
                key={e.userId}
                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm ${e.userId === userId ? "bg-gold/15" : "bg-paper-dim"}`}
              >
                <span className="flex items-center gap-3">
                  <span className="w-5 font-display text-gold-bright">{e.rank}</span>
                  <span className="text-ink/80">{e.name}</span>
                </span>
                <span className="flex items-center gap-3 text-ink/50">
                  <span>{t("achievementsCount", { count: e.achievements })}</span>
                  <span className="font-display text-base text-ink">{e.points}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
        <LeaderboardToggle initial={me?.showOnLeaderboard ?? true} />
      </Reveal>

      <Reveal delay={0.15} className="mt-8">
        <h2 className="font-display text-xl">{t("howYouEarnedIt")}</h2>
        {summary.sources.length === 0 ? (
          <p className="mt-4 text-sm text-ink/40">{t("noActivityYet")}</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {summary.sources.map((s) => (
              <div key={s.source} className="rounded-2xl bg-paper-dim p-4">
                <div className="flex items-baseline justify-between">
                  <p className="font-medium">{zh ? s.labelZh : s.label}</p>
                  <p className="font-display text-lg text-gold-bright">{s.points}</p>
                </div>
                {s.source === "ACHIEVEMENTS" ? (
                  <p className="mt-1 text-xs text-ink/50">{t("achievementsBonus", { count: s.count })}</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-xs text-ink/60">
                    {s.items.map((i) => (
                      <li key={i.key} className="flex justify-between gap-3">
                        <span>
                          {i.count} × {zh ? i.labelZh : i.label}
                        </span>
                        <span className="shrink-0 text-ink/45">{i.points}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </Reveal>

      <Reveal delay={0.18} className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl">{t("achievements")}</h2>
          <p className="text-sm text-ink/50">{t("achievementsUnlocked", { unlocked: unlockedCount, total: achievements.length })}</p>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {achievements.map((a) => {
            const unlocked = Boolean(a.unlockedAt);
            return (
              <div
                key={a.id}
                className={`flex gap-3 rounded-2xl border p-3 ${unlocked ? "border-gold/40 bg-gold/10" : "border-ink/10 bg-paper-dim opacity-70"}`}
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-xl" aria-hidden>
                  {unlocked ? a.emoji : <Lock className="h-4 w-4 text-ink/40" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{zh ? a.nameZh : a.name}</p>
                  <p className="text-xs text-ink/55">{zh ? a.descriptionZh : a.description}</p>
                  <p className="mt-1 text-xs text-ink/45">
                    <span className="text-gold-bright">+{a.points}</span>
                    {a.unlockedAt ? ` · ${t("unlockedOn", { date: a.unlockedAt.toISOString().slice(0, 10) })}` : ` · ${t("locked")}`}
                    {` · ${t("unlockedByPercent", { percent: completion[a.id] ?? 0 })}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={0.2} className="mt-8">
        <h2 className="font-display text-xl">{t("recentActivity")}</h2>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-ink/40">{t("noActivityYet")}</p>
        ) : (
          <StaggerGroup className="mt-4 space-y-2">
            {recent.map((e) => (
              <StaggerItem key={e.id}>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-paper-dim px-4 py-3 text-sm">
                  <span className="text-ink/75">{eventLabel(e.key)}</span>
                  <span className="flex shrink-0 items-center gap-3 text-ink/40">
                    <span className="text-gold-bright">+{e.points}</span>
                    {formatDistanceToNow(e.createdAt, { addSuffix: true })}
                  </span>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </Reveal>
    </>
  );
}
