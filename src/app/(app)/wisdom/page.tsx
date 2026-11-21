import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { getT } from "@/lib/i18n/server";
import { WisdomTopicList } from "./WisdomTopicList";
import { PinMap } from "@/components/map/PinMap";

export default async function WisdomPage() {
  const session = await auth();
  const t = await getT("wisdom");
  const currentUser = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, adminScopes: true },
      })
    : null;

  const [topics, pinned] = await Promise.all([
    prisma.wisdomTopic.findMany({ select: { id: true, title: true, category: true }, orderBy: { title: "asc" } }),
    prisma.wisdomRecommendation.findMany({
      where: { lat: { not: null }, lng: { not: null } },
      select: { id: true, placeName: true, address: true, location: true, lat: true, lng: true, topic: { select: { id: true, title: true, category: true } } },
      take: 2000,
    }),
  ]);
  const pins = pinned.map((r) => ({
    id: r.id, name: r.placeName, address: r.address ?? r.location, lat: r.lat!, lng: r.lng!,
    category: r.topic.category, topicId: r.topic.id, topicTitle: r.topic.title,
  }));

  return (
    <div>
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">{t("pageTitle")}</h1>
          <p className="mt-2 max-w-lg text-ink/60">
            {t("pageDescription")}
          </p>
        </div>
        <div data-tour="wisdom-start-btn">
          <LinkButton href={session ? "/wisdom/new" : "/login"}>{t("startATopic")}</LinkButton>
        </div>
      </Reveal>

      <div className="mt-8">
        <PinMap pins={pins} topics={topics} canAdd={Boolean(currentUser)} />
      </div>

      <Reveal delay={0.1} className="mt-10">
        <div data-tour="wisdom-list">
          <WisdomTopicList currentUserId={currentUser?.id ?? null} isAdmin={currentUser ? hasScope(currentUser, "WISDOM") : false} />
        </div>
      </Reveal>
    </div>
  );
}
