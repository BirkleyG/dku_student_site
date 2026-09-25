import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Award } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { scorePoints } from "@/lib/community-score";
import type { ScoreReason } from "@prisma/client";
import { getT } from "@/lib/i18n/server";
import { LanguageToggle } from "@/components/shell/LanguageToggle";

export default async function ProfilePage() {
  const t = await getT("profile");
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { scoreEvents: { orderBy: { createdAt: "desc" }, take: 25 } },
  });
  if (!user) redirect("/login");

  const breakdown = Object.keys(scorePoints).reduce<Record<string, number>>((acc, reason) => {
    acc[reason] = user.scoreEvents.filter((e) => e.reason === reason).reduce((s, e) => s + e.points, 0);
    return acc;
  }, {});

  const rank = await prisma.user.count({ where: { communityScore: { gt: user.communityScore } } });

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">{t("yourProfile")}</p>
          <h1 className="mt-2 font-display text-4xl">
            {user.firstName} {user.lastName}
          </h1>
        </div>
        <LanguageToggle className="mt-1 shrink-0" />
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <Card className="flex items-center gap-5">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-bright">
            <Award className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-ink/45">{t("communityScore")}</p>
            <p className="mt-1 font-display text-4xl">{user.communityScore}</p>
            <p className="mt-1 text-sm text-ink/50">{t("rankOnCampus", { rank: rank + 1 })}</p>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.15} className="mt-8">
        <h2 className="font-display text-xl">{t("howYouEarnedIt")}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(Object.keys(scorePoints) as ScoreReason[]).map((reason) => (
            <div key={reason} className="rounded-2xl bg-paper-dim p-3">
              <p className="text-lg font-display">{breakdown[reason] ?? 0}</p>
              <p className="mt-0.5 text-xs text-ink/50">{t(reason)}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.2} className="mt-8">
        <h2 className="font-display text-xl">{t("recentActivity")}</h2>
        {user.scoreEvents.length === 0 ? (
          <p className="mt-4 text-sm text-ink/40">{t("noActivityYet")}</p>
        ) : (
          <StaggerGroup className="mt-4 space-y-2">
            {user.scoreEvents.map((e) => (
              <StaggerItem key={e.id}>
                <div className="flex items-center justify-between rounded-xl bg-paper-dim px-4 py-3 text-sm">
                  <span className="text-ink/75">{t(e.reason)}</span>
                  <span className="flex items-center gap-3 text-ink/40">
                    <span className="text-gold-bright">+{e.points}</span>
                    {formatDistanceToNow(e.createdAt, { addSuffix: true })}
                  </span>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </Reveal>
    </div>
  );
}
