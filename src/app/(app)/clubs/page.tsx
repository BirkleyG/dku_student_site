import { auth } from "@/lib/auth";
import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { getT } from "@/lib/i18n/server";
import { ClubsDirectory } from "./ClubsDirectory";

export default async function ClubsPage() {
  const session = await auth();
  const t = await getT("clubs");

  return (
    <div>
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">{t("pageHeading")}</h1>
          <p className="mt-1 text-sm text-ink/50">{t("pageSubheading")}</p>
        </div>
        <LinkButton href={session ? "/clubs/new" : "/login"}>{t("addClubButton")}</LinkButton>
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <ClubsDirectory />
      </Reveal>
    </div>
  );
}
