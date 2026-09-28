import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Reveal } from "@/components/motion/Reveal";
import { GuidelinesNote } from "@/components/shell/GuidelinesNote";
import { getT } from "@/lib/i18n/server";
import { NewDearDkuForm } from "./NewDearDkuForm";

export default async function NewDearDkuPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dear-dku/new");
  const t = await getT("dearDku");

  return (
    <div className="mx-auto max-w-xl">
      <Reveal>
        <h1 className="font-display text-4xl">{t("publishHeading")}</h1>
        <p className="mt-2 text-ink/60">{t("publishSubheading")}</p>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <NewDearDkuForm />
        <GuidelinesNote />
      </Reveal>
    </div>
  );
}
