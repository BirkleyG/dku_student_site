import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { Reveal } from "@/components/motion/Reveal";
import { PlannerBoard } from "./PlannerBoard";

export default async function PlannerPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }
  const t = await getT("planner");

  return (
    <div>
      <Reveal>
        <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">{t("pageEyebrow")}</p>
        <h1 className="mt-2 font-display text-4xl">{t("pageHeading")}</h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <PlannerBoard />
      </Reveal>
    </div>
  );
}
