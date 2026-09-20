import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultWidgetOrder } from "@/lib/widgets";
import { WidgetCard } from "@/components/widgets/WidgetCard";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Customize } from "./Customize";
import type { WidgetType } from "@prisma/client";
import { format } from "date-fns";

export default async function HomePage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0];

  let widgets: WidgetType[] = defaultWidgetOrder;
  let userId: string | null = null;

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    userId = user?.id ?? null;
    if (user) {
      const saved = await prisma.dashboardWidget.findMany({
        where: { userId: user.id },
        orderBy: { position: "asc" },
      });
      if (saved.length) widgets = saved.map((w) => w.type);
    }
  }

  const [upcomingEvents, recentPosts, recentNews, topWisdom, clubCount] = await Promise.all([
    widgets.includes("EVENTS")
      ? prisma.event.findMany({
          where: { startsAt: { gte: new Date() }, approved: true },
          orderBy: { startsAt: "asc" },
          take: 3,
        })
      : Promise.resolve([]),
    widgets.includes("SOCIAL")
      ? prisma.boardPost.findMany({ orderBy: { createdAt: "desc" }, take: 3 })
      : Promise.resolve([]),
    widgets.includes("NEWS")
      ? prisma.newsPost.findMany({ orderBy: { publishedAt: "desc" }, take: 2 })
      : Promise.resolve([]),
    widgets.includes("WISDOM")
      ? prisma.wisdomPost.findMany({ orderBy: { createdAt: "desc" }, take: 3 })
      : Promise.resolve([]),
    widgets.includes("CLUBS") ? prisma.club.count({ where: { approved: true } }) : Promise.resolve(0),
  ]);

  return (
    <div>
      <Reveal>
        <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">
          {firstName ? `Welcome back, ${firstName}` : "Welcome"}
        </p>
        <h1 className="mt-2 font-display text-4xl">
          Your DKU, <em className="italic text-gold-bright">all in one place.</em>
        </h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-6">
        <Customize initial={widgets} canSave={Boolean(userId)} />
      </Reveal>

      <StaggerGroup className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {widgets.map((type) => (
          <StaggerItem key={type}>
            <WidgetCard type={type}>
              {type === "EVENTS" ? (
                upcomingEvents.length ? (
                  <ul className="space-y-2 text-sm">
                    {upcomingEvents.map((event) => (
                      <li key={event.id} className="text-ink/75">
                        <span className="text-ink/40">{format(event.startsAt, "MMM d, h:mm a")}</span>
                        {" — "}
                        {event.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink/40">No events on the calendar yet.</p>
                )
              ) : null}

              {type === "SOCIAL" ? (
                recentPosts.length ? (
                  <ul className="space-y-2 text-sm">
                    {recentPosts.map((post) => (
                      <li key={post.id} className="truncate text-ink/75">
                        {post.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink/40">Nothing posted yet.</p>
                )
              ) : null}

              {type === "NEWS" ? (
                recentNews.length ? (
                  <ul className="space-y-2 text-sm">
                    {recentNews.map((post) => (
                      <li key={post.id} className="truncate text-ink/75">
                        {post.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink/40">No articles yet.</p>
                )
              ) : null}

              {type === "WISDOM" ? (
                topWisdom.length ? (
                  <ul className="space-y-2 text-sm">
                    {topWisdom.map((post) => (
                      <li key={post.id} className="truncate text-ink/75">
                        {post.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink/40">No recs yet — add the first.</p>
                )
              ) : null}

              {type === "CLUBS" ? (
                <p className="text-sm text-ink/75">
                  {clubCount > 0 ? `${clubCount} club${clubCount === 1 ? "" : "s"} listed` : "No clubs listed yet."}
                </p>
              ) : null}
            </WidgetCard>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </div>
  );
}
