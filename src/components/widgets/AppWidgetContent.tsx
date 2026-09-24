import { format, isSameWeek, isToday } from "date-fns";
import type { EventCategory } from "@prisma/client";
import { EVENT_CATEGORY_MAP } from "@/lib/event-categories";
import { HappeningNowDot } from "@/components/motion/HappeningNowDot";
import type { WidgetInstance } from "@/lib/widgets";
import type { EatsWidgetData } from "@/lib/eats-live";

export type WidgetData = {
  now: string;
  events: { id: string; title: string; startsAt: string; endsAt: string; location: string; category: EventCategory }[];
  boardPosts: { id: string; title: string; authorName: string; createdAt: string; commentCount: number }[];
  trackedPosts: Record<string, { postId: string; title: string; authorName: string; unreadCount: number } | null>;
  eats: EatsWidgetData;
};

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-ink/40">{label}</p>;
}

function eventsTallyConfig(config: Record<string, unknown>) {
  const categories = Array.isArray(config.categories) ? (config.categories as EventCategory[]) : [];
  const timeframe = config.timeframe === "week" ? "week" : "today";
  return { categories, timeframe: timeframe as "today" | "week" };
}

export function AppWidgetContent({ instance, data }: { instance: WidgetInstance; data: WidgetData }) {
  const now = new Date(data.now);

  switch (instance.kind) {
    case "EVENTS_TALLY": {
      const { categories, timeframe } = eventsTallyConfig(instance.config);
      const inRange = data.events.filter((e) => {
        const start = new Date(e.startsAt);
        return timeframe === "today" ? isToday(start) : isSameWeek(start, now, { weekStartsOn: 0 });
      });
      const matching = categories.length ? inRange.filter((e) => categories.includes(e.category)) : inRange;
      const filterLabel =
        categories.length === 0 ? "All events" : categories.length === 1 ? EVENT_CATEGORY_MAP[categories[0]].label : `${categories.length} types`;
      return (
        <div>
          <p className="font-display text-3xl leading-none text-ink">{matching.length}</p>
          <p className="mt-1.5 text-xs text-ink/50">
            {timeframe === "today" ? "Today" : "This week"} · {filterLabel}
          </p>
        </div>
      );
    }

    case "EVENTS_AGENDA": {
      const upcoming = data.events
        .filter((e) => isToday(new Date(e.startsAt)) && new Date(e.endsAt) >= now)
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
      const visible = upcoming.slice(0, 4);
      const remaining = upcoming.length - visible.length;
      return (
        <div className="flex h-full flex-col">
          <p className="text-xs text-ink/40">{format(now, "EEEE, MMM d · h:mm a")}</p>
          {visible.length ? (
            <ul className="mt-2 space-y-1.5 text-sm">
              {visible.map((e) => (
                <li key={e.id} className="flex items-center gap-1.5 truncate text-ink/75">
                  <HappeningNowDot startsAt={e.startsAt} endsAt={e.endsAt} />
                  <span className="truncate">
                    <span className="text-ink/40">{format(new Date(e.startsAt), "h:mm a")}</span> {e.title}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink/40">Nothing left on today&apos;s calendar.</p>
          )}
          {remaining > 0 ? <p className="mt-auto pt-1 text-xs text-ink/40">+{remaining} more today</p> : null}
        </div>
      );
    }

    case "EATS_OPEN_COUNT":
      return (
        <div>
          <p className="font-display text-3xl leading-none text-ink">
            {data.eats.openCount}
            <span className="text-base text-ink/40"> / {data.eats.totalCount}</span>
          </p>
          <p className="mt-1.5 text-xs text-ink/50">Kitchens open right now</p>
        </div>
      );

    case "EATS_FAVORITE": {
      const name = typeof instance.config.restaurantName === "string" ? instance.config.restaurantName : null;
      if (!name) return <Empty label="Pick your go-to kitchen." />;
      const vendor = data.eats.vendors.find((v) => v.name === name);
      return (
        <div>
          <p className="text-xs text-ink/40">Your favorite</p>
          <p className="mt-0.5 truncate text-sm font-medium text-ink">{name}</p>
          {vendor ? (
            <p className={`mt-1 flex items-center gap-1.5 text-xs ${vendor.open ? "text-sprout-deep" : "text-ink/40"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${vendor.open ? "bg-sprout-deep" : "bg-ink/25"}`} />
              {vendor.open ? "Open now" : "Closed"}
            </p>
          ) : null}
        </div>
      );
    }

    case "EATS_ORDER_TRACKER":
      return data.eats.order ? (
        <div>
          <p className="text-xs text-ink/40">{data.eats.order.restaurant}</p>
          <p className="mt-0.5 text-sm font-medium text-ink">{data.eats.order.status}</p>
          {data.eats.order.detail ? <p className="text-xs text-ink/50">{data.eats.order.detail}</p> : null}
        </div>
      ) : (
        <Empty label="No active order." />
      );

    case "EATS_ACTIVITY":
      return data.eats.activity.length ? (
        <div>
          <ul className="space-y-1.5 text-sm">
            {data.eats.activity.slice(0, 2).map((a) => (
              <li key={a.id} className="text-ink/75">
                <span>{a.text}</span> <span className="text-xs text-ink/40">· {a.timeAgo}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <Empty label="No orders yet today." />
      );

    case "BOARD_LATEST": {
      const item = data.boardPosts[0];
      if (!item) return <Empty label="No posts yet. Start the conversation." />;
      return (
        <div>
          <p className="text-xs text-ink/40">{item.authorName}</p>
          <p className="mt-0.5 line-clamp-2 text-sm font-medium text-ink">{item.title}</p>
        </div>
      );
    }

    case "BOARD_RECENT": {
      const items = data.boardPosts.slice(0, 4);
      if (!items.length) return <Empty label="No posts yet. Start the conversation." />;
      return (
        <ul className="space-y-1.5 text-sm">
          {items.map((p) => (
            <li key={p.id} className="truncate text-ink/75">
              <span className="text-ink/40">{p.authorName}</span> {p.title}
            </li>
          ))}
        </ul>
      );
    }

    case "BOARD_TRACKED_POST": {
      const tracked = data.trackedPosts[instance.id];
      if (!tracked) return <Empty label="Pick a post to track." />;
      return (
        <div>
          <p className="line-clamp-2 text-sm font-medium text-ink">{tracked.title}</p>
          <p className="mt-1.5 text-xs text-ink/50">
            {tracked.unreadCount > 0 ? `${tracked.unreadCount} new comment${tracked.unreadCount === 1 ? "" : "s"}` : "No new comments"}
          </p>
        </div>
      );
    }

    default:
      return null;
  }
}
