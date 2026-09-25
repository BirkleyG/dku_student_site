import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { getT } from "@/lib/i18n/server";
import { ProfessorsDirectory } from "./ProfessorsDirectory";

export default async function ProfessorsPage() {
  const session = await auth();
  const t = await getT("professors");
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
          <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">{t("pageEyebrow")}</p>
          <h1 className="mt-2 font-display text-4xl">{t("pageHeading")}</h1>
        </div>
        <LinkButton href={session ? "/professors/new" : "/login"}>{t("addProfessorButton")}</LinkButton>
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <ProfessorsDirectory
          currentUserId={currentUser?.id ?? null}
          isAdmin={currentUser ? hasScope(currentUser, "PROFESSORS") : false}
        />
      </Reveal>
    </div>
  );
}
