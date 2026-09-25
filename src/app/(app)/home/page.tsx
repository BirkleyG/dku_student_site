import { addDays, startOfDay } from "date-fns";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultLayout } from "@/lib/widgets";
import type { WidgetInstance } from "@/lib/widgets";
import type { WidgetData } from "@/components/widgets/AppWidgetContent";
import { demoEatsWidgetData } from "@/lib/eats-demo";
import { fetchEatsWidgetData } from "@/lib/eats-live";
import { getLilypadCategories, getLilypadPosts } from "@/lib/lilypad";
import { HomeDashboard } from "@/components/widgets/HomeDashboard";
import { Reveal } from "@/components/motion/Reveal";
import { GoldBurst } from "@/components/effects/GoldBurst";
import { WelcomeModal } from "@/components/layout/WelcomeModal";
import type { EatsWidgetData } from "@/lib/eats-live";
import { getT } from "@/lib/i18n/server";

// fetchEatsWidgetData already catches its own errors and returns null on
// failure, but this dashboard has been taken down by an unhandled query
// error once already — belt and suspenders so a future change to that file
// can't reopen the same hole.
async function fetchEatsWidgetDataSafely(user: { id: string; netId: string | null } | null): Promise<EatsWidgetData> {
  try {
    return (await fetchEatsWidgetData(user)) ?? demoEatsWidgetData();
  } catch (err) {
    console.error("DKU Eats widget data threw unexpectedly, falling back to sample data:", err);
    return demoEatsWidgetData();
  }
}

export default async function HomePage() {
  const t = await getT("home");
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0];

  let layout: WidgetInstance[] = defaultLayout.map((w) => ({ id: crypto.randomUUID(), kind: w.kind, config: w.config ?? {} }));
  let userId: string | null = null;
  let eatsUser: { id: string; netId: string | null } | null = null;
  let savedRows: Awaited<ReturnType<typeof prisma.dashboardWidget.findMany>> = [];

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    userId = user?.id ?? null;
    // DKU Eats SSO signs people in with their DKU Life user id as the Firebase
    // uid; guest orders are keyed by netID instead, so match on both.
    eatsUser = user ? { id: user.id, netId: user.netId } : null;
    if (user) {
      try {
        savedRows = await prisma.dashboardWidget.findMany({
          where: { userId: user.id },
          orderBy: { position: "asc" },
        });
        if (savedRows.length) {
          layout = savedRows.map((w) => ({ id: w.id, kind: w.kind, config: (w.config ?? {}) as Record<string, unknown> }));
        }
      } catch (err) {
        // A saved-layout read failing (e.g. the DB hasn't picked up a recent
        // widget-schema migration yet) shouldn't take the whole dashboard
        // down — fall back to the default layout instead of 500ing.
        console.error("Failed to load saved dashboard layout, falling back to default:", err);
      }
    }
  }

  const today = startOfDay(new Date());
  const weekAhead = addDays(today, 7);

  const boardPostInclude = { author: true, _count: { select: { comments: true } } } satisfies Prisma.BoardPostInclude;
  let events: Prisma.EventGetPayload<object>[] = [];
  let boardPosts: Prisma.BoardPostGetPayload<{ include: typeof boardPostInclude }>[] = [];
  try {
    [events, boardPosts] = await Promise.all([
      prisma.event.findMany({
        where: { startsAt: { gte: today, lte: weekAhead }, approved: true },
        orderBy: { startsAt: "asc" },
      }),
      prisma.boardPost.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: boardPostInclude,
      }),
    ]);
  } catch (err) {
    // Same principle as the widget-layout read above: a widget's own data
    // source having a bad day shouldn't take the entire dashboard down.
    console.error("Failed to load events/board data for the dashboard:", err);
  }

  const trackedWidgets = savedRows.filter((w) => w.kind === "BOARD_TRACKED_POST");
  const trackedPosts: WidgetData["trackedPosts"] = {};
  await Promise.all(
    trackedWidgets.map(async (w) => {
      const config = (w.config ?? {}) as Record<string, unknown>;
      const postId = typeof config.postId === "string" ? config.postId : null;
      if (!postId) {
        trackedPosts[w.id] = null;
        return;
      }
      try {
        const post = await prisma.boardPost.findUnique({
          where: { id: postId },
          include: {
            author: true,
            _count: { select: { comments: { where: { createdAt: { gt: w.createdAt } } } } },
          },
        });
        trackedPosts[w.id] = post
          ? { postId: post.id, title: post.title, authorName: post.author.firstName, unreadCount: post._count.comments }
          : null;
      } catch (err) {
        console.error(`Failed to load tracked post for widget ${w.id}:`, err);
        trackedPosts[w.id] = null;
      }
    }),
  );

  const lilypadWidgets = layout.filter((w) => w.kind === "LILYPAD_LATEST");
  const lilypadByWidget: WidgetData["lilypadByWidget"] = {};
  const [lilypadCategories] = await Promise.all([
    getLilypadCategories(),
    ...lilypadWidgets.map(async (w) => {
      const categoryId = typeof w.config.categoryId === "number" ? w.config.categoryId : undefined;
      const { posts } = await getLilypadPosts({ page: 1, perPage: 4, categoryId });
      lilypadByWidget[w.id] = posts;
    }),
  ]);

  const data: WidgetData = {
    now: new Date().toISOString(),
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      startsAt: e.startsAt.toISOString(),
      endsAt: e.endsAt.toISOString(),
      location: e.location,
      category: e.category,
    })),
    boardPosts: boardPosts.map((p) => ({
      id: p.id,
      title: p.title,
      authorName: p.author.firstName,
      createdAt: p.createdAt.toISOString(),
      commentCount: p._count.comments,
    })),
    trackedPosts,
    eats: await fetchEatsWidgetDataSafely(eatsUser),
    lilypadCategories,
    lilypadByWidget,
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-ink/10 bg-paper px-6 py-10 sm:px-10 sm:py-14">
        <GoldBurst
          originXPct={92}
          originYPct={115}
          className="[mask-image:radial-gradient(ellipse_70%_90%_at_92%_100%,black_35%,transparent_80%)]"
        />
        <Reveal className="relative">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">
            {firstName ? t("welcomeBack", { name: firstName }) : t("welcome")}
          </p>
          <h1 className="mt-2 font-display text-4xl">{t("heroHeading")}</h1>
        </Reveal>
      </div>

      <Reveal delay={0.1} className="mt-8">
        <HomeDashboard initialLayout={layout} data={data} canSave={Boolean(userId)} />
      </Reveal>

      {session?.user ? null : <WelcomeModal />}
    </div>
  );
}
