import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Reveal } from "@/components/motion/Reveal";
import { GuidelinesNote } from "@/components/shell/GuidelinesNote";
import { getT } from "@/lib/i18n/server";
import { BackLink } from "@/components/shell/BackLink";
import { NewCourseForm } from "./NewCourseForm";

export default async function NewCoursePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/courses/new");
  const t = await getT("courses");

  return (
    <div className="mx-auto max-w-xl">
      <Reveal>
        <BackLink href="/courses" label={t("backToCourses")} className="mb-4" />
        <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">{t("newCourseEyebrow")}</p>
        <h1 className="mt-2 font-display text-4xl">{t("newCourseHeading")}</h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <NewCourseForm />
        <GuidelinesNote />
      </Reveal>
    </div>
  );
}
