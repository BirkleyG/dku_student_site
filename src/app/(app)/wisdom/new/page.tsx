import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Reveal } from "@/components/motion/Reveal";
import { GuidelinesNote } from "@/components/shell/GuidelinesNote";
import { getT } from "@/lib/i18n/server";
import { NewWisdomForm } from "./NewWisdomForm";

export default async function NewWisdomPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/wisdom/new");
  const t = await getT("wisdom");

  return (
    <div className="mx-auto max-w-xl">
      <Reveal>
        <h1 className="font-display text-4xl">{t("startATopicHeading")}</h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <NewWisdomForm />
        <GuidelinesNote />
      </Reveal>
    </div>
  );
}
