import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { getT } from "@/lib/i18n/server";
import { DearDkuPostList } from "./DearDkuPostList";

export default async function DearDkuPage() {
  const session = await auth();
  const t = await getT("dearDku");
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
          <p className="mt-2 max-w-xl text-ink/60">{t("pageDescription")}</p>
        </div>
        <div data-tour="dear-dku-publish-btn">
          <LinkButton href={session ? "/dear-dku/new" : "/login"}>{t("publish")}</LinkButton>
        </div>
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <div data-tour="dear-dku-list">
          <DearDkuPostList
            currentUserId={currentUser?.id ?? null}
            isAdmin={currentUser ? hasScope(currentUser, "DEARDKU") : false}
          />
        </div>
      </Reveal>
    </div>
  );
}
