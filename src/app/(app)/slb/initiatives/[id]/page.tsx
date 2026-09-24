import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { DeleteButton } from "@/components/shell/DeleteButton";
import { INITIATIVE_STATUS, getSlbViewer } from "@/lib/slb";
import { BackButton, InitiativeVote, StatusControl } from "../../SlbClient";

export default async function InitiativePage({ params }: PageProps<"/slb/initiatives/[id]">) {
  const { id } = await params;
  const viewer = await getSlbViewer();
  const person = { select: { id: true, firstName: true, lastName: true, slbMembership: { select: { title: true } } } };
  const initiative = await prisma.slbInitiative.findUnique({
    where: { id },
    include: {
      sponsor: person,
      backers: { orderBy: { createdAt: "asc" }, include: { user: person } },
      votes: { select: { value: true, userId: true } },
    },
  });
  if (!initiative) notFound();

  const status = INITIATIVE_STATUS[initiative.status];
  const yes = initiative.votes.filter((v) => v.value > 0).length;
  const no = initiative.votes.filter((v) => v.value < 0).length;
  const mine = viewer ? initiative.votes.find((v) => v.userId === viewer.id)?.value : undefined;
  const closed = initiative.status === "PASSED" || initiative.status === "NOT_PASSED";
  const isSponsor = viewer?.id === initiative.sponsorId;
  const canEdit = Boolean(viewer && (isSponsor || viewer.canManage));
  const backed = Boolean(viewer && initiative.backers.some((b) => b.userId === viewer.id));
  const label = (u: { firstName: string; lastName: string; slbMembership: { title: string } | null }) =>
    `${u.firstName} ${u.lastName}${u.slbMembership ? `, ${u.slbMembership.title}` : ""}`;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/slb?tab=initiatives" className="focus-ring text-sm text-ink/50 hover:text-ink">
        ← All initiatives
      </Link>

      <Reveal className="mt-4">
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>{status.label}</span>
        <h1 className="mt-3 font-display text-4xl leading-tight">{initiative.title}</h1>
        <p className="mt-2 text-lg text-ink/65">{initiative.summary}</p>
        <p className="mt-3 text-sm text-ink/45">
          Sponsored by {label(initiative.sponsor)} · Proposed {format(initiative.createdAt, "MMM d, yyyy")}
        </p>
      </Reveal>

      <Card className="mt-8">
        <p className="text-sm font-medium text-ink">Where do you stand?</p>
        <div className="mt-3">
          <InitiativeVote
            initiativeId={initiative.id}
            yes={yes}
            no={no}
            myVote={mine === 1 || mine === -1 ? mine : null}
            closed={closed}
            loggedIn={Boolean(viewer)}
          />
        </div>
      </Card>

      <section className="mt-10">
        <h2 className="font-display text-2xl">The agenda</h2>
        <div className="mt-3 space-y-3 text-ink/80">
          {initiative.body.split(/\n\s*\n/).map((para, i) => (
            <p key={i} className="whitespace-pre-line">
              {para}
            </p>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Backed by</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-ink/75">
          <li>
            {label(initiative.sponsor)} <span className="text-ink/40">(sponsor)</span>
          </li>
          {initiative.backers.map((b) => (
            <li key={b.id}>{label(b.user)}</li>
          ))}
        </ul>
        {viewer?.isMember && !isSponsor ? (
          <div className="mt-4">
            <BackButton initiativeId={initiative.id} backed={backed} />
          </div>
        ) : null}
      </section>

      {canEdit ? (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-6">
          <StatusControl initiativeId={initiative.id} status={initiative.status} />
          <DeleteButton
            endpoint={`/api/slb/initiatives/${initiative.id}`}
            redirectTo="/slb?tab=initiatives"
            confirmText="Delete this initiative? Votes and backers go with it."
            label="Delete initiative"
          />
        </div>
      ) : null}
    </div>
  );
}
