import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { DeleteButton } from "@/components/shell/DeleteButton";
import { INITIATIVE_STATUS, SLB_OFFICIAL_URL, canPublish, getSlbViewer } from "@/lib/slb";
import { SLB_FEEDBACK_URL, SLB_GET_INVOLVED, SLB_ROSTER } from "@/lib/slb-roster";
import {
  AboutEditor,
  AddMember,
  NewAnnouncement,
  NewInitiative,
  NewPoll,
  PollCard,
  RemoveMember,
  RosterPhoto,
} from "./SlbClient";

const TABS = [
  { key: "home", label: "Home" },
  { key: "initiatives", label: "Initiatives" },
  { key: "announcements", label: "Announcements" },
  { key: "polls", label: "Polls" },
  { key: "members", label: "Members" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const DEFAULT_ABOUT = `The Duke Kunshan Student Leaders Board (SLB) is a body of student leaders, endorsed by peers and appointed by the University, to represent and serve student interests and needs in collaboration and consultation with the University leadership.

Here, SLB posts announcements and new agendas, runs polls, and puts forward initiatives: proposals members are fighting for. Read what they're working on, see who backs it, and vote yes or no.`;

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-ink/75">
      {text.split(/\n\s*\n/).map((para, i) => (
        <p key={i} className="whitespace-pre-line">
          {para}
        </p>
      ))}
    </div>
  );
}

function name(u: { firstName: string; lastName: string }) {
  return `${u.firstName} ${u.lastName}`;
}

export default async function SlbPage({ searchParams }: PageProps<"/slb">) {
  const params = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === params.tab) ? (params.tab as Tab) : "home";
  const viewer = await getSlbViewer();
  const publisher = canPublish(viewer);

  const person = { select: { firstName: true, lastName: true, slbMembership: { select: { title: true } } } };
  const [about, announcements, polls, initiatives, members] = await Promise.all([
    prisma.slbAbout.findUnique({ where: { id: "about" } }),
    prisma.slbAnnouncement.findMany({ orderBy: { createdAt: "desc" }, include: { author: person }, take: tab === "home" ? 1 : 50 }),
    prisma.slbPoll.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: person,
        options: { orderBy: { position: "asc" }, include: { _count: { select: { votes: true } } } },
        votes: viewer ? { where: { userId: viewer.id }, select: { optionId: true } } : false,
      },
      take: 50,
    }),
    prisma.slbInitiative.findMany({
      orderBy: { createdAt: "desc" },
      include: { sponsor: person, _count: { select: { backers: true } }, votes: { select: { value: true } } },
    }),
    prisma.slbMember.findMany({ orderBy: { createdAt: "asc" }, include: { user: { select: { id: true, firstName: true, lastName: true } } } }),
  ]);

  const now = new Date();
  const pollCards = polls.map((poll) => ({
    ...poll,
    closed: Boolean(poll.closesAt && poll.closesAt <= now),
    myVote: poll.votes?.[0]?.optionId ?? null,
    optionTallies: poll.options.map((o) => ({ id: o.id, label: o.label, votes: o._count.votes })),
  }));
  const initiativeCards = initiatives.map((i) => ({
    ...i,
    yes: i.votes.filter((v) => v.value > 0).length,
    no: i.votes.filter((v) => v.value < 0).length,
  }));

  const renderPoll = (poll: (typeof pollCards)[number]) => (
    <Card key={poll.id}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl">{poll.question}</h3>
          <p className="mt-1 text-xs text-ink/45">
            {name(poll.author)}
            {poll.author.slbMembership ? `, ${poll.author.slbMembership.title}` : ""} ·{" "}
            {poll.closesAt ? (poll.closed ? "Closed" : `Closes ${formatDistanceToNow(poll.closesAt, { addSuffix: true })}`) : "Open"}
          </p>
        </div>
        {viewer && (viewer.id === poll.authorId || viewer.canManage) ? (
          <DeleteButton endpoint={`/api/slb/polls/${poll.id}`} redirectTo="/slb?tab=polls" confirmText="Delete this poll?" label="Delete" />
        ) : null}
      </div>
      <div className="mt-4">
        <PollCard pollId={poll.id} options={poll.optionTallies} myVote={poll.myVote} closed={poll.closed} loggedIn={Boolean(viewer)} />
      </div>
    </Card>
  );

  const renderInitiative = (i: (typeof initiativeCards)[number]) => {
    const status = INITIATIVE_STATUS[i.status];
    const total = i.yes + i.no;
    return (
      <Link key={i.id} href={`/slb/initiatives/${i.id}`} className="focus-ring block">
        <Card className="h-full transition-transform duration-300 hover:-translate-y-0.5">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${status.className}`}>{status.label}</span>
          <h3 className="mt-2 font-display text-xl leading-snug">{i.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-ink/60">{i.summary}</p>
          <p className="mt-3 text-xs text-ink/45">
            Sponsored by {name(i.sponsor)} · {i._count.backers} backer{i._count.backers === 1 ? "" : "s"} ·{" "}
            {total ? `${Math.round((i.yes / total) * 100)}% yes of ${total}` : "No votes yet"}
          </p>
        </Card>
      </Link>
    );
  };

  const renderAnnouncement = (a: (typeof announcements)[number]) => (
    <Card key={a.id}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ink/45">
            {name(a.author)}
            {a.author.slbMembership ? `, ${a.author.slbMembership.title}` : ""} · {formatDistanceToNow(a.createdAt, { addSuffix: true })}
          </p>
          <h3 className="mt-1 font-display text-xl">{a.title}</h3>
        </div>
        {viewer && (viewer.id === a.authorId || viewer.canManage) ? (
          <DeleteButton endpoint={`/api/slb/announcements/${a.id}`} redirectTo="/slb?tab=announcements" confirmText="Delete this announcement?" label="Delete" />
        ) : null}
      </div>
      <div className="mt-3 text-sm">
        <Paragraphs text={a.body} />
      </div>
    </Card>
  );

  return (
    <div>
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Student Leaders Board</h1>
          <p className="mt-1 text-sm text-ink/45">昆山杜克学生理事会</p>
          <p className="mt-2 max-w-xl text-ink/60">What SLB is working on, what they&apos;re asking, and where you stand.</p>
        </div>
        <a
          href={SLB_OFFICIAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex items-center gap-1 text-sm text-ink/55 hover:text-ink"
        >
          Official SLB site <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </Reveal>

      <nav className="mt-8 flex gap-1 overflow-x-auto border-b border-ink/10" aria-label="SLB sections">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "home" ? "/slb" : `/slb?tab=${t.key}`}
            scroll={false}
            className={`focus-ring -mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors ${
              tab === t.key ? "border-ink text-ink" : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        {tab === "home" ? (
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <section>
              <h2 className="font-display text-2xl">About SLB</h2>
              <div className="mt-3">
                <Paragraphs text={about?.body ?? DEFAULT_ABOUT} />
              </div>
              <a
                href={SLB_OFFICIAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring mt-4 inline-flex items-center gap-1 text-sm text-ink/60 underline-offset-2 hover:text-ink hover:underline"
              >
                Read more on the official SLB page <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              {publisher ? (
                <div className="mt-3">
                  <AboutEditor initialBody={about?.body ?? DEFAULT_ABOUT} />
                </div>
              ) : null}

              <h2 className="mt-10 font-display text-2xl">Get involved</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {SLB_GET_INVOLVED.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring inline-flex items-center gap-1 rounded-full border border-ink/15 px-3 py-1.5 text-sm text-ink/70 hover:border-ink/35 hover:text-ink"
                  >
                    {link.label} <ArrowUpRight className="h-3 w-3" />
                  </a>
                ))}
              </div>

              <h2 className="mt-10 font-display text-2xl">Initiatives on the floor</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {initiativeCards.filter((i) => i.status === "PROPOSED" || i.status === "IN_PROGRESS").slice(0, 4).map(renderInitiative)}
              </div>
              {initiativeCards.length === 0 ? <p className="mt-2 text-sm text-ink/45">No initiatives yet.</p> : null}
              <Link href="/slb?tab=initiatives" className="focus-ring mt-3 inline-block text-sm text-ink/55 hover:text-ink">
                All initiatives →
              </Link>
            </section>

            <aside className="space-y-8">
              <Card>
                <p className="font-medium text-ink">We want to hear from you</p>
                <p className="mt-1 text-sm text-ink/60">Suggestions, complaints, initiatives: SLB&apos;s feedback form takes all of it.</p>
                <a
                  href={SLB_FEEDBACK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring mt-3 inline-flex items-center gap-1 text-sm font-medium text-ink underline-offset-2 hover:underline"
                >
                  Open the feedback form <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </Card>
              <section>
                <h2 className="font-display text-2xl">Latest announcement</h2>
                <div className="mt-3">
                  {announcements[0] ? renderAnnouncement(announcements[0]) : <p className="text-sm text-ink/45">Nothing posted yet.</p>}
                </div>
              </section>
              <section>
                <h2 className="font-display text-2xl">Open poll</h2>
                <div className="mt-3">
                  {pollCards.find((p) => !p.closed) ? renderPoll(pollCards.find((p) => !p.closed)!) : <p className="text-sm text-ink/45">No open polls.</p>}
                </div>
              </section>
            </aside>
          </div>
        ) : null}

        {tab === "initiatives" ? (
          <div className="space-y-6">
            <p className="max-w-2xl text-sm text-ink/60">
              Initiatives are proposals SLB members are pushing for, like bills. Other members can back them, and anyone can vote
              yes or no.
            </p>
            {publisher ? <NewInitiative /> : null}
            <div className="grid gap-4 sm:grid-cols-2">{initiativeCards.map(renderInitiative)}</div>
            {initiativeCards.length === 0 ? <p className="text-sm text-ink/45">No initiatives yet.</p> : null}
          </div>
        ) : null}

        {tab === "announcements" ? (
          <div className="max-w-3xl space-y-4">
            {publisher ? <NewAnnouncement /> : null}
            {announcements.map(renderAnnouncement)}
            {announcements.length === 0 ? <p className="text-sm text-ink/45">No announcements yet.</p> : null}
          </div>
        ) : null}

        {tab === "polls" ? (
          <div className="max-w-3xl space-y-4">
            {publisher ? <NewPoll /> : null}
            {pollCards.map(renderPoll)}
            {pollCards.length === 0 ? <p className="text-sm text-ink/45">No polls yet.</p> : null}
          </div>
        ) : null}

        {tab === "members" ? (
          <div className="space-y-12">
            {SLB_ROSTER.map((section) => (
              <section key={section.group}>
                <h2 className="font-display text-2xl">{section.group}</h2>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {section.people.map((p) => (
                    <figure key={p.name}>
                      <RosterPhoto src={p.photo} name={p.name} />
                      <figcaption className="mt-2">
                        <p className="text-sm font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-ink/55">{p.role}</p>
                        <p className="text-xs text-ink/40">{p.classOf}</p>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            ))}

            <section className="max-w-3xl border-t border-ink/10 pt-8">
              <h2 className="font-display text-2xl">On DKU Life</h2>
              <p className="mt-1 text-sm text-ink/55">
                SLB members linked to a DKU Life account can post announcements, run polls, propose initiatives and back each other&apos;s.
              </p>
              <div className="mt-4 space-y-4">
                {viewer?.canManage ? <AddMember /> : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  {members.map((m) => (
                    <Card key={m.id} className="flex items-center justify-between gap-3 p-4">
                      <div>
                        <p className="font-medium text-ink">{name(m.user)}</p>
                        <p className="text-sm text-ink/55">{m.title}</p>
                      </div>
                      {viewer?.canManage ? <RemoveMember userId={m.user.id} name={name(m.user)} /> : null}
                    </Card>
                  ))}
                </div>
                {members.length === 0 ? (
                  <p className="text-sm text-ink/45">
                    No accounts linked yet.{viewer?.canManage ? " Add members above by netID or email." : ""}
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
