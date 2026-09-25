import { notFound } from "next/navigation";
import Link from "next/link";
import { Globe, Mail, Phone } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { Reveal } from "@/components/motion/Reveal";
import { DeleteButton } from "@/components/shell/DeleteButton";
import { LinkButton } from "@/components/ui/Button";
import { clubCategoryLabels, groupTypeLabels, athleticKindLabels } from "@/lib/club-validation";
import { getT } from "@/lib/i18n/server";
import { MembersPanel } from "./MembersPanel";

export default async function ClubPage({ params }: PageProps<"/clubs/[id]">) {
  const { id } = await params;
  const t = await getT("clubs");
  const [session, club] = await Promise.all([
    auth(),
    prisma.club.findUnique({
      where: { id },
      include: {
        officers: true,
        members: {
          orderBy: { joinedAt: "asc" },
          select: { userId: true, role: true, joinedAt: true, user: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
    }),
  ]);

  if (!club || !club.approved) notFound();

  const currentUser = session?.user?.email
    ? await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true, adminScopes: true } })
    : null;

  const myMembership = currentUser ? club.members.find((m) => m.userId === currentUser.id) ?? null : null;
  const canManage = Boolean(
    currentUser && (currentUser.id === club.submittedById || myMembership?.role === "MANAGER" || hasScope(currentUser, "CLUBS")),
  );
  const canDelete = Boolean(currentUser && (currentUser.id === club.submittedById || hasScope(currentUser, "CLUBS")));

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {club.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={club.logoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
          ) : null}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-sprout/25 px-2.5 py-0.5 text-xs font-medium text-sprout-deep">
                {clubCategoryLabels[club.category]}
                {club.athleticKind ? ` · ${athleticKindLabels[club.athleticKind]}` : ""}
              </span>
              <span className="rounded-full border border-ink/15 px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-ink/50">
                {groupTypeLabels[club.type]}
              </span>
            </div>
            <h1 className="mt-2 font-display text-4xl">{club.name}</h1>
            {club.sportName ? <p className="mt-1 text-sm text-ink/50">{club.sportName}</p> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {canManage ? <LinkButton href={`/clubs/${club.id}/edit`} variant="secondary">{t("editButton")}</LinkButton> : null}
          {canDelete ? <DeleteButton endpoint={`/api/clubs/${club.id}`} redirectTo="/clubs" /> : null}
        </div>
      </Reveal>

      <Reveal delay={0.1} className="mt-6">
        <p className="whitespace-pre-wrap text-ink/75">{club.description}</p>
      </Reveal>

      {club.officers.length ? (
        <Reveal delay={0.15} className="mt-8">
          <h2 className="text-xs uppercase tracking-[0.15em] text-ink/50">{t("leadershipHeading")}</h2>
          <ul className="mt-3 space-y-2">
            {club.officers.map((o) => (
              <li key={o.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
                <span>
                  <span className="font-medium text-ink">{o.name}</span>{" "}
                  <span className="text-ink/50">— {o.title}</span>
                </span>
                {o.contact ? <span className="text-ink/50">{o.contact}</span> : null}
              </li>
            ))}
          </ul>
        </Reveal>
      ) : null}

      <Reveal delay={0.2} className="mt-8">
        <h2 className="text-xs uppercase tracking-[0.15em] text-ink/50">{t("getInTouchHeading")}</h2>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-ink/70">
          {club.contactMethod === "EMAIL" && club.contactValue ? (
            <a href={`mailto:${club.contactValue}`} className="focus-ring flex items-center gap-1.5 hover:text-ink">
              <Mail className="h-4 w-4" /> {club.contactValue}
            </a>
          ) : null}
          {club.contactMethod === "PHONE" && club.contactValue ? (
            <a href={`tel:${club.contactValue}`} className="focus-ring flex items-center gap-1.5 hover:text-ink">
              <Phone className="h-4 w-4" /> {club.contactValue}
            </a>
          ) : null}
          {club.contactMethod === "OTHER" && club.contactValue ? <span>{club.contactValue}</span> : null}
          {club.website ? (
            <a
              href={club.website}
              target="_blank"
              rel="noreferrer"
              className="focus-ring flex items-center gap-1.5 hover:text-ink"
            >
              <Globe className="h-4 w-4" /> {t("websiteLinkText")}
            </a>
          ) : null}
        </div>
        {club.contactMethod === "WECHAT" && club.contactQrUrl ? (
          <div className="mt-3">
            <p className="text-xs text-ink/50">{t("scanOnWechat")}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={club.contactQrUrl} alt={t("wechatQrAlt")} className="mt-2 h-40 w-40 rounded-xl border border-ink/15 object-contain" />
          </div>
        ) : null}
      </Reveal>

      <Reveal delay={0.25} className="mt-10">
        <MembersPanel
          clubId={club.id}
          openJoin={club.openJoin}
          canManage={canManage}
          isLoggedIn={Boolean(session?.user)}
          isMember={Boolean(myMembership)}
          isCreator={currentUser?.id === club.submittedById}
          initialMembers={club.members.map((m) => ({
            userId: m.userId,
            role: m.role,
            name: `${m.user.firstName} ${m.user.lastName}`,
            email: m.user.email,
          }))}
        />
      </Reveal>

      <Reveal delay={0.3} className="mt-8">
        <Link href="/clubs" className="focus-ring text-xs text-ink/50 hover:text-ink">
          {t("backToAllClubs")}
        </Link>
      </Reveal>
    </div>
  );
}
