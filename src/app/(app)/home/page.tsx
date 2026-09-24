import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultLayout } from "@/lib/widgets";
import type { WidgetInstance } from "@/lib/widgets";
import type { WidgetData } from "@/components/widgets/AppWidgetContent";
import { HomeDashboard } from "@/components/widgets/HomeDashboard";
import { Reveal } from "@/components/motion/Reveal";
import { GoldBurst } from "@/components/effects/GoldBurst";

export default async function HomePage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0];

  let layout: WidgetInstance[] = defaultLayout.map((w) => ({ id: crypto.randomUUID(), ...w }));
  let userId: string | null = null;

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    userId = user?.id ?? null;
    if (user) {
      const saved = await prisma.dashboardWidget.findMany({
        where: { userId: user.id },
        orderBy: { position: "asc" },
      });
      if (saved.length) {
        layout = saved.map((w) => ({ id: w.id, app: w.type, size: w.size }));
      }
    }
  }

  const [events, boardPosts, wisdomPosts, newsPosts, clubs] = await Promise.all([
    prisma.event.findMany({
      where: { startsAt: { gte: new Date() }, approved: true },
      orderBy: { startsAt: "asc" },
      take: 4,
    }),
    prisma.boardPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { author: true },
    }),
    prisma.wisdomPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.newsPost.findMany({
      orderBy: { publishedAt: "desc" },
      take: 4,
    }),
    prisma.club.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const data: WidgetData = {
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      startsAt: e.startsAt.toISOString(),
      endsAt: e.endsAt.toISOString(),
      location: e.location,
    })),
    boardPosts: boardPosts.map((p) => ({
      id: p.id,
      title: p.title,
      authorName: p.author.firstName,
      createdAt: p.createdAt.toISOString(),
    })),
    wisdomPosts: wisdomPosts.map((w) => ({ id: w.id, title: w.title, category: w.category, createdAt: w.createdAt.toISOString() })),
    newsPosts: newsPosts.map((n) => ({ id: n.id, title: n.title, summary: n.summary, publishedAt: n.publishedAt.toISOString() })),
    clubs: clubs.map((c) => ({ id: c.id, name: c.name, category: c.category, description: c.description })),
  };

  return (
    <div>
      <div className="relative">
        <GoldBurst originXPct={78} originYPct={15} />
        <Reveal>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">
            {firstName ? `Welcome back, ${firstName}` : "Welcome"}
          </p>
          <h1 className="mt-2 font-display text-4xl">Events, food, and everyone&apos;s dorm gossip.</h1>
        </Reveal>
      </div>

      <Reveal delay={0.1} className="mt-8">
        <HomeDashboard initialLayout={layout} data={data} canSave={Boolean(userId)} />
      </Reveal>
    </div>
  );
}
