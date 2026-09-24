import type { WidgetKind as PrismaWidgetKind } from "@prisma/client";
import { CalendarDays, UtensilsCrossed, MessagesSquare, type LucideIcon } from "lucide-react";
import { DEMO_RESTAURANTS } from "@/lib/eats-demo";

export type WidgetKind = PrismaWidgetKind;
export type WidgetDisplaySize = "SMALL" | "MEDIUM" | "LARGE";

export type WidgetKindMeta = {
  kind: WidgetKind;
  label: string;
  size: WidgetDisplaySize;
  icon: LucideIcon;
  href: string;
  blurb: string;
  configurable: boolean;
  demo?: boolean;
};

export const widgetCatalog: Record<WidgetKind, WidgetKindMeta> = {
  EVENTS_TALLY: {
    kind: "EVENTS_TALLY",
    label: "Events tally",
    size: "SMALL",
    icon: CalendarDays,
    href: "/events",
    blurb: "A count of events matching a filter — today or this week. Add a few to track different categories.",
    configurable: true,
  },
  EVENTS_AGENDA: {
    kind: "EVENTS_AGENDA",
    label: "Today's agenda",
    size: "LARGE",
    icon: CalendarDays,
    href: "/events",
    blurb: "What's on the calendar today, in order, with the current time.",
    configurable: false,
  },
  EATS_OPEN_COUNT: {
    kind: "EATS_OPEN_COUNT",
    label: "Restaurants open",
    size: "MEDIUM",
    icon: UtensilsCrossed,
    href: "/eats",
    blurb: "How many DKU Eats restaurants are open right now.",
    configurable: false,
    demo: true,
  },
  EATS_FAVORITE: {
    kind: "EATS_FAVORITE",
    label: "Favorite restaurant",
    size: "SMALL",
    icon: UtensilsCrossed,
    href: "/eats",
    blurb: "One tap to your go-to spot on DKU Eats.",
    configurable: true,
    demo: true,
  },
  EATS_ORDER_TRACKER: {
    kind: "EATS_ORDER_TRACKER",
    label: "Order tracker",
    size: "MEDIUM",
    icon: UtensilsCrossed,
    href: "/eats",
    blurb: "Live status of your current DKU Eats order.",
    configurable: false,
    demo: true,
  },
  EATS_ACTIVITY: {
    kind: "EATS_ACTIVITY",
    label: "Eats activity",
    size: "MEDIUM",
    icon: UtensilsCrossed,
    href: "/eats",
    blurb: "What's being ordered around campus right now.",
    configurable: false,
    demo: true,
  },
  BOARD_LATEST: {
    kind: "BOARD_LATEST",
    label: "Latest post",
    size: "SMALL",
    icon: MessagesSquare,
    href: "/social",
    blurb: "The single most recent post on the Board.",
    configurable: false,
  },
  BOARD_RECENT: {
    kind: "BOARD_RECENT",
    label: "Recent posts",
    size: "LARGE",
    icon: MessagesSquare,
    href: "/social",
    blurb: "A running feed of the latest Board posts.",
    configurable: false,
  },
  BOARD_TRACKED_POST: {
    kind: "BOARD_TRACKED_POST",
    label: "Track a post",
    size: "SMALL",
    icon: MessagesSquare,
    href: "/social",
    blurb: "Pick a post and see how many new comments it's gotten since.",
    configurable: true,
  },
};

export type WidgetGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  kinds: WidgetKind[];
};

export const widgetGroups: WidgetGroup[] = [
  { key: "events", label: "Events", icon: CalendarDays, kinds: ["EVENTS_AGENDA", "EVENTS_TALLY"] },
  {
    key: "eats",
    label: "DKU Eats",
    icon: UtensilsCrossed,
    kinds: ["EATS_OPEN_COUNT", "EATS_FAVORITE", "EATS_ORDER_TRACKER", "EATS_ACTIVITY"],
  },
  { key: "board", label: "The Board", icon: MessagesSquare, kinds: ["BOARD_LATEST", "BOARD_RECENT", "BOARD_TRACKED_POST"] },
];

export const sizeSpec: Record<WidgetDisplaySize, { className: string }> = {
  SMALL: { className: "col-span-1 row-span-1" },
  MEDIUM: { className: "col-span-2 row-span-1" },
  LARGE: { className: "col-span-2 row-span-2" },
};

/** A widget "instance" placed on someone's dashboard. */
export type WidgetInstance = {
  id: string;
  kind: WidgetKind;
  config: Record<string, unknown>;
};

/** Sensible starting config for a freshly-added widget of this kind. */
export function defaultConfigFor(kind: WidgetKind): Record<string, unknown> {
  switch (kind) {
    case "EVENTS_TALLY":
      return { categories: [], timeframe: "today" };
    case "EATS_FAVORITE":
      return { restaurantName: DEMO_RESTAURANTS[0] };
    default:
      return {};
  }
}

export function hrefForInstance(instance: WidgetInstance): string {
  if (instance.kind === "BOARD_TRACKED_POST" && typeof instance.config.postId === "string" && instance.config.postId) {
    return `/social/${instance.config.postId}`;
  }
  return widgetCatalog[instance.kind].href;
}

export const defaultLayout: Array<{ kind: WidgetKind; config?: Record<string, unknown> }> = [
  { kind: "EVENTS_AGENDA" },
  { kind: "EATS_OPEN_COUNT" },
  { kind: "EVENTS_TALLY", config: { categories: [], timeframe: "today" } },
  { kind: "EVENTS_TALLY", config: { categories: ["CLUBS"], timeframe: "week" } },
  { kind: "BOARD_LATEST" },
  { kind: "EATS_FAVORITE", config: { restaurantName: DEMO_RESTAURANTS[0] } },
];
