import { redirect } from "next/navigation";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAnyAdmin, hasScope, canModerateEvent } from "@/lib/permissions";
import { EVENT_CATEGORY_MAP } from "@/lib/event-categories";
import { Reveal } from "@/components/motion/Reveal";
import { DeleteButton } from "@/components/shell/DeleteButton";
import { TabsShell } from "./TabsShell";
import { UsersPanel } from "./UsersPanel";
import { InviteCodesPanel } from "./InviteCodesPanel";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const requester = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!requester || !isAnyAdmin(requester)) redirect("/home");

  const isSuperAdmin = requester.role === "ADMIN";

  const [events, clubs, news, wisdomPosts, boardPosts, users, inviteCodes] = await Promise.all([
    hasScope(requester, "EVENTS") || hasScope(requester, "SPORTS")
      ? prisma.event.findMany({
          orderBy: { startsAt: "desc" },
          take: 20,
          include: { host: { select: { firstName: true, lastName: true } } },
        })
      : Promise.resolve([]),
    hasScope(requester, "CLUBS")
      ? prisma.club.findMany({ orderBy: { createdAt: "desc" }, take: 20 })
      : Promise.resolve([]),
    hasScope(requester, "NEWS")
      ? prisma.newsPost.findMany({ orderBy: { publishedAt: "desc" }, take: 20 })
      : Promise.resolve([]),
    hasScope(requester, "WISDOM")
      ? prisma.wisdomPost.findMany({ orderBy: { createdAt: "desc" }, take: 20 })
      : Promise.resolve([]),
    hasScope(requester, "BOARD")
      ? prisma.boardPost.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { author: { select: { firstName: true, lastName: true } } },
        })
      : Promise.resolve([]),
    isSuperAdmin
      ? prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            netId: true,
            role: true,
            adminScopes: true,
            emailVerified: true,
          },
        })
      : Promise.resolve([]),
    isSuperAdmin
      ? prisma.inviteCode.findMany({
          orderBy: { createdAt: "desc" },
          include: { usedBy: { select: { firstName: true, lastName: true, email: true } } },
        })
      : Promise.resolve([]),
  ]);

  const tabs = [];

  if (isSuperAdmin) {
    tabs.push({
      key: "permissions",
      label: "Permissions",
      content: (
        <UsersPanel
          currentUserId={requester.id}
          initialUsers={users.map((u) => ({ ...u, emailVerified: u.emailVerified?.toISOString() ?? null }))}
        />
      ),
    });
    tabs.push({
      key: "invites",
      label: "Invite codes",
      content: (
        <InviteCodesPanel
          initialCodes={inviteCodes.map((c) => ({
            ...c,
            usedAt: c.usedAt?.toISOString() ?? null,
            createdAt: c.createdAt.toISOString(),
          }))}
        />
      ),
    });
  }

  if (events.length || hasScope(requester, "EVENTS") || hasScope(requester, "SPORTS")) {
    tabs.push({
      key: "events",
      label: "Events",
      content: (
        <ModerationList
          empty="No events yet."
          rows={events
            .filter((e) => canModerateEvent(requester, e.category))
            .map((e) => ({
              id: e.id,
              title: e.title,
              subtitle: `${EVENT_CATEGORY_MAP[e.category].label} · ${format(e.startsAt, "MMM d, h:mm a")} · ${e.host.firstName} ${e.host.lastName}`,
              endpoint: `/api/events/${e.id}`,
            }))}
        />
      ),
    });
  }

  if (hasScope(requester, "CLUBS")) {
    tabs.push({
      key: "clubs",
      label: "Clubs",
      content: (
        <ModerationList
          empty="No clubs yet."
          rows={clubs.map((c) => ({ id: c.id, title: c.name, subtitle: c.category, endpoint: `/api/clubs/${c.id}` }))}
        />
      ),
    });
  }

  if (hasScope(requester, "NEWS")) {
    tabs.push({
      key: "news",
      label: "News",
      content: (
        <ModerationList
          empty="No articles yet."
          rows={news.map((n) => ({
            id: n.id,
            title: n.title,
            subtitle: format(n.publishedAt, "MMM d, yyyy"),
            endpoint: `/api/news/${n.id}`,
          }))}
        />
      ),
    });
  }

  if (hasScope(requester, "WISDOM")) {
    tabs.push({
      key: "wisdom",
      label: "Wisdom",
      content: (
        <ModerationList
          empty="No posts yet."
          rows={wisdomPosts.map((w) => ({ id: w.id, title: w.title, subtitle: w.category, endpoint: `/api/wisdom/${w.id}` }))}
        />
      ),
    });
  }

  if (hasScope(requester, "BOARD")) {
    tabs.push({
      key: "board",
      label: "Board",
      content: (
        <ModerationList
          empty="No posts yet."
          rows={boardPosts.map((b) => ({
            id: b.id,
            title: b.title,
            subtitle: `${b.author.firstName} ${b.author.lastName} · ${format(b.createdAt, "MMM d")}`,
            endpoint: `/api/board/${b.id}`,
          }))}
        />
      ),
    });
  }

  return (
    <div>
      <Reveal>
        <h1 className="font-display text-4xl">
          {isSuperAdmin ? "Run the beta." : "Your moderation tools."}
        </h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <TabsShell tabs={tabs} />
      </Reveal>
    </div>
  );
}

function ModerationList({
  rows,
  empty,
}: {
  rows: { id: string; title: string; subtitle: string; endpoint: string }[];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink/40">{empty}</p>;
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-paper px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{row.title}</p>
            <p className="truncate text-xs text-ink/45">{row.subtitle}</p>
          </div>
          <DeleteButton endpoint={row.endpoint} redirectTo="/admin" />
        </div>
      ))}
    </div>
  );
}
