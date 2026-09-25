import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { getT } from "@/lib/i18n/server";
import { WisdomTopicList } from "./WisdomTopicList";

export default async function WisdomPage() {
  const session = await auth();
  const t = await getT("wisdom");
  const currentUser = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, adminScopes: true },
      })
    : null;

  return (
    <div>
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">{t("pageTitle")}</h1>
          <p className="mt-2 max-w-lg text-ink/60">
            {t("pageDescription")}
          </p>
        </div>
        <LinkButton href={session ? "/wisdom/new" : "/login"}>{t("startATopic")}</LinkButton>
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <WisdomTopicList currentUserId={currentUser?.id ?? null} isAdmin={currentUser ? hasScope(currentUser, "WISDOM") : false} />
      </Reveal>
    </div>
  );
}
