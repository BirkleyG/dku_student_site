import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Reveal } from "@/components/motion/Reveal";
import { GuidelinesNote } from "@/components/shell/GuidelinesNote";
import { getT } from "@/lib/i18n/server";
import { BackLink } from "@/components/shell/BackLink";
import { NewProfessorForm } from "./NewProfessorForm";

export default async function NewProfessorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/professors/new");
  const t = await getT("professors");

  return (
    <div className="mx-auto max-w-xl">
      <Reveal>
        <BackLink href="/professors" label={t("backToProfessors")} className="mb-4" />
        <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">{t("newProfessorEyebrow")}</p>
        <h1 className="mt-2 font-display text-4xl">{t("newProfessorHeading")}</h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <NewProfessorForm />
        <GuidelinesNote />
      </Reveal>
    </div>
  );
}
