import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { wisdomCategoryLabels } from "@/lib/wisdom-validation";
import { Reveal } from "@/components/motion/Reveal";
import { MapPin } from "lucide-react";
import { DeleteButton } from "@/components/shell/DeleteButton";
import { getT } from "@/lib/i18n/server";
import { RecommendationList } from "./RecommendationList";

export default async function WisdomTopicPage({ params }: PageProps<"/wisdom/[id]">) {
  const { id } = await params;
  const t = await getT("wisdom");
  const [session, topic] = await Promise.all([
    auth(),
    prisma.wisdomTopic.findUnique({
      where: { id },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        recommendations: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { firstName: true, lastName: true } }, votes: true },
        },
      },
    }),
  ]);

  if (!topic) notFound();

  const currentUser = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, adminScopes: true },
      })
    : null;
  const isWisdomAdmin = currentUser ? hasScope(currentUser, "WISDOM") : false;
  const canDeleteTopic = currentUser && (currentUser.id === topic.createdById || isWisdomAdmin);

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-sprout/25 px-2.5 py-0.5 text-xs font-medium text-sprout-deep">
              {wisdomCategoryLabels[topic.category]}
            </span>
            {topic.requireLocation ? (
              <span className="flex items-center gap-1 text-xs text-ink/45">
                <MapPin className="h-3 w-3" /> {t("locationRequired")}
              </span>
            ) : null}
          </div>
          <h1 className="mt-2 font-display text-4xl">{topic.title}</h1>
          <p className="mt-2 text-sm text-ink/50">
            {t("startedBy", { name: `${topic.createdBy.firstName} ${topic.createdBy.lastName}` })}
          </p>
        </div>
        {canDeleteTopic ? (
          <DeleteButton endpoint={`/api/wisdom/${topic.id}`} redirectTo="/wisdom" confirmText={t("confirmRemoveTopic")} />
        ) : null}
      </Reveal>

      {topic.description ? (
        <Reveal delay={0.05} className="mt-4 whitespace-pre-wrap leading-relaxed text-ink/80">
          {topic.description}
        </Reveal>
      ) : null}

      <Reveal delay={0.1}>
        <RecommendationList
          topicId={topic.id}
          requireLocation={topic.requireLocation}
          currentUserId={currentUser?.id ?? null}
          isAdmin={isWisdomAdmin}
          canAdd={Boolean(session?.user)}
          initialRecommendations={topic.recommendations.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
        />
      </Reveal>
    </div>
  );
}
