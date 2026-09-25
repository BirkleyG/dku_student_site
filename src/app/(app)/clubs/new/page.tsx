import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Reveal } from "@/components/motion/Reveal";
import { GuidelinesNote } from "@/components/shell/GuidelinesNote";
import { getT } from "@/lib/i18n/server";
import { ClubForm } from "../ClubForm";

export default async function NewClubPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/clubs/new");
  const t = await getT("clubs");

  return (
    <div className="mx-auto max-w-xl">
      <Reveal>
        <h1 className="font-display text-4xl">{t("newClubHeading")}</h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <ClubForm mode="create" />
        <GuidelinesNote />
      </Reveal>
    </div>
  );
}
