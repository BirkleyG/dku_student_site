import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/motion/Reveal";
import { getT } from "@/lib/i18n/server";
import { LanguageToggle } from "@/components/shell/LanguageToggle";
import { syncEatsPoints } from "@/lib/eats-live";
import { PointsSection } from "@/components/profile/PointsSection";

export default async function ProfilePage() {
  const t = await getT("profile");
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");

  // DKU Eats lives in its own database; pull its orders into the points ledger (best-effort).
  await syncEatsPoints({ id: user.id, netId: user.netId });

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">{t("yourProfile")}</p>
          <h1 className="mt-2 font-display text-4xl">
            {user.firstName} {user.lastName}
          </h1>
        </div>
        <LanguageToggle className="mt-1 shrink-0" />
      </Reveal>

      <PointsSection userId={user.id} />
    </div>
  );
}
