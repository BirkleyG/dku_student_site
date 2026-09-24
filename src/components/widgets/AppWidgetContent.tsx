import { format } from "date-fns";
import type { WidgetApp, WidgetSize } from "@/lib/widgets";
import { sizeSpec } from "@/lib/widgets";

export type WidgetData = {
  events: { id: string; title: string; startsAt: string; location: string }[];
  boardPosts: { id: string; title: string; authorName: string; createdAt: string }[];
  wisdomPosts: { id: string; title: string; category: string; createdAt: string }[];
  newsPosts: { id: string; title: string; summary: string; publishedAt: string }[];
  clubs: { id: string; name: string; category: string; description: string }[];
};

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-ink/40">{label}</p>;
}

export function AppWidgetContent({ app, size, data }: { app: WidgetApp; size: WidgetSize; data: WidgetData }) {
  const n = sizeSpec[size].itemCount;

  switch (app) {
    case "EVENTS": {
      const items = data.events.slice(0, n);
      if (!items.length) return <Empty label="No events on the calendar yet." />;
      if (size === "SMALL") {
        return (
          <div>
            <p className="text-xs text-ink/40">Up next</p>
            <p className="mt-0.5 truncate text-sm font-medium text-ink">{items[0].title}</p>
            <p className="text-xs text-ink/50">{format(new Date(items[0].startsAt), "MMM d, h:mm a")}</p>
          </div>
        );
      }
      return (
        <ul className="space-y-1.5 text-sm">
          {items.map((e) => (
            <li key={e.id} className="truncate text-ink/75">
              <span className="text-ink/40">{format(new Date(e.startsAt), "MMM d, h:mm a")}</span> — {e.title}
            </li>
          ))}
        </ul>
      );
    }

    case "SOCIAL": {
      const items = data.boardPosts.slice(0, n);
      if (!items.length) return <Empty label="No posts yet — start the conversation." />;
      if (size === "SMALL") {
        return (
          <div>
            <p className="text-xs text-ink/40">Latest</p>
            <p className="mt-0.5 line-clamp-2 text-sm font-medium text-ink">{items[0].title}</p>
          </div>
        );
      }
      return (
        <ul className="space-y-1.5 text-sm">
          {items.map((p) => (
            <li key={p.id} className="truncate text-ink/75">
              <span className="text-ink/40">{p.authorName}</span> — {p.title}
            </li>
          ))}
        </ul>
      );
    }

    case "WISDOM": {
      const items = data.wisdomPosts.slice(0, n);
      if (!items.length) return <Empty label="No wisdom dropped yet." />;
      if (size === "SMALL") {
        return (
          <div>
            <p className="text-xs text-ink/40">{items[0].category}</p>
            <p className="mt-0.5 line-clamp-2 text-sm font-medium text-ink">{items[0].title}</p>
          </div>
        );
      }
      return (
        <ul className="space-y-1.5 text-sm">
          {items.map((w) => (
            <li key={w.id} className="truncate text-ink/75">
              <span className="text-ink/40">{w.category}</span> — {w.title}
            </li>
          ))}
        </ul>
      );
    }

    case "NEWS": {
      const items = data.newsPosts.slice(0, n);
      if (!items.length) return <Empty label="Nothing published yet." />;
      if (size === "SMALL") {
        return <p className="line-clamp-3 text-sm font-medium text-ink">{items[0].title}</p>;
      }
      return (
        <ul className="space-y-2 text-sm">
          {items.map((a) => (
            <li key={a.id} className="text-ink/75">
              <p className="font-medium text-ink">{a.title}</p>
              {size === "LARGE" ? <p className="line-clamp-1 text-xs text-ink/50">{a.summary}</p> : null}
            </li>
          ))}
        </ul>
      );
    }

    case "CLUBS": {
      const items = data.clubs.slice(0, n);
      if (!items.length) return <Empty label="No clubs listed yet." />;
      if (size === "SMALL") {
        return (
          <div>
            <p className="text-xs text-ink/40">{items[0].category}</p>
            <p className="mt-0.5 line-clamp-2 text-sm font-medium text-ink">{items[0].name}</p>
          </div>
        );
      }
      return (
        <ul className="space-y-1.5 text-sm">
          {items.map((c) => (
            <li key={c.id} className="truncate text-ink/75">
              <span className="text-ink/40">{c.category}</span> — {c.name}
            </li>
          ))}
        </ul>
      );
    }

    case "DKU_EATS":
      return (
        <p className="text-sm text-ink/60">
          {size === "SMALL" ? "Order food" : "Order student-cooked food and drinks, delivered on campus."}
        </p>
      );

    case "MARKETPLACE":
      return (
        <p className="text-sm text-ink/60">
          {size === "SMALL" ? "Buy & sell" : "Browse what students are selling — textbooks, furniture, and more."}
        </p>
      );

    case "SLB":
      return (
        <p className="text-sm text-ink/60">
          {size === "SMALL" ? "Ask a rep" : "See your reps, ask questions, and submit issues to SLB."}
        </p>
      );

    default:
      return null;
  }
}
