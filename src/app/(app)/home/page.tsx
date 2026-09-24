import { addDays, startOfDay } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultLayout } from "@/lib/widgets";
import type { WidgetInstance } from "@/lib/widgets";
import type { WidgetData } from "@/components/widgets/AppWidgetContent";
import { demoEatsWidgetData } from "@/lib/eats-demo";
import { fetchEatsWidgetData } from "@/lib/eats-live";
import { HomeDashboard } from "@/components/widgets/HomeDashboard";
import { Reveal } from "@/components/motion/Reveal";
import { GoldBurst } from "@/components/effects/GoldBurst";
import { WelcomeModal } from "@/components/layout/WelcomeModal";

export default async function HomePage() {
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

  const [events, boardPosts] = await Promise.all([
    prisma.event.findMany({
      where: { startsAt: { gte: today, lte: weekAhead }, approved: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.boardPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { author: true, _count: { select: { comments: true } } },
    }),
  ]);

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
    eats: (await fetchEatsWidgetData(eatsUser)) ?? demoEatsWidgetData(),
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
            {firstName ? `Welcome back, ${firstName}` : "Welcome"}
          </p>
          <h1 className="mt-2 font-display text-4xl">Events, food, and everyone&apos;s dorm gossip.</h1>
        </Reveal>
      </div>

      <Reveal delay={0.1} className="mt-8">
        <HomeDashboard initialLayout={layout} data={data} canSave={Boolean(userId)} />
      </Reveal>

      {session?.user ? null : <WelcomeModal />}
    </div>
  );
}
