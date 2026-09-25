import { auth } from "@/lib/auth";
import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { getT } from "@/lib/i18n/server";
import { BoardFeed } from "./BoardFeed";

export default async function SocialPage() {
  const session = await auth();
  const t = await getT("social");

  return (
    <div>
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">{t("pageTitle")}</h1>
          <p className="mt-2 max-w-lg text-ink/60">
            {t("pageDescriptionPrefix")}{" "}
            <a href="/terms" className="underline decoration-ink/30 underline-offset-2 hover:text-ink">
              {t("communityGuidelines")}
            </a>
            .
          </p>
        </div>
        <LinkButton href={session ? "/social/new" : "/login?callbackUrl=/social/new"}>{t("newPost")}</LinkButton>
      </Reveal>

      <Reveal delay={0.1}>
        <BoardFeed />
      </Reveal>
    </div>
  );
}
