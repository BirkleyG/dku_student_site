import type { WidgetKind as PrismaWidgetKind } from "@prisma/client";
import { CalendarDays, UtensilsCrossed, MessagesSquare, Newspaper, type LucideIcon } from "lucide-react";

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
  /** Fed by DKU Eats; shows a "Sample" badge when live Eats data isn't available. */
  eatsData?: boolean;
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
    eatsData: true,
  },
  EATS_FAVORITE: {
    kind: "EATS_FAVORITE",
    label: "Favorite restaurant",
    size: "SMALL",
    icon: UtensilsCrossed,
    href: "/eats",
    blurb: "One tap to your go-to spot on DKU Eats.",
    configurable: true,
    eatsData: true,
  },
  EATS_ORDER_TRACKER: {
    kind: "EATS_ORDER_TRACKER",
    label: "Order tracker",
    size: "MEDIUM",
    icon: UtensilsCrossed,
    href: "/eats",
    blurb: "Live status of your current DKU Eats order.",
    configurable: false,
    eatsData: true,
  },
  EATS_ACTIVITY: {
    kind: "EATS_ACTIVITY",
    label: "Eats activity",
    size: "MEDIUM",
    icon: UtensilsCrossed,
    href: "/eats",
    blurb: "What's being ordered around campus right now.",
    configurable: false,
    eatsData: true,
  },
  CHAT_LATEST: {
    kind: "CHAT_LATEST",
    label: "Latest message",
    size: "SMALL",
    icon: MessagesSquare,
    href: "/chat",
    blurb: "The single most recent message across your chats.",
    configurable: false,
  },
  CHAT_RECENT: {
    kind: "CHAT_RECENT",
    label: "Recent messages",
    size: "LARGE",
    icon: MessagesSquare,
    href: "/chat",
    blurb: "A running feed of the latest messages across your chats.",
    configurable: false,
  },
  CHAT_TRACKED_CHANNEL: {
    kind: "CHAT_TRACKED_CHANNEL",
    label: "Track a channel",
    size: "SMALL",
    icon: MessagesSquare,
    href: "/chat",
    blurb: "Pick a channel and see how many new messages it's gotten since.",
    configurable: true,
  },
  LILYPAD_LATEST: {
    kind: "LILYPAD_LATEST",
    label: "Latest from the Lilypad",
    size: "LARGE",
    icon: Newspaper,
    href: "/news",
    blurb: "The newest articles from DKU's independent student publication. Pick a category or show them all.",
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
  { key: "chat", label: "Chat", icon: MessagesSquare, kinds: ["CHAT_LATEST", "CHAT_RECENT", "CHAT_TRACKED_CHANNEL"] },
  { key: "lilypad", label: "The Lilypad", icon: Newspaper, kinds: ["LILYPAD_LATEST"] },
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
      return {};
    case "LILYPAD_LATEST":
      return { categoryId: null };
    default:
      return {};
  }
}

export function hrefForInstance(instance: WidgetInstance): string {
  return widgetCatalog[instance.kind].href;
}

export const defaultLayout: Array<{ kind: WidgetKind; config?: Record<string, unknown> }> = [
  { kind: "EVENTS_AGENDA" },
  { kind: "EATS_OPEN_COUNT" },
  { kind: "EVENTS_TALLY", config: { categories: [], timeframe: "today" } },
  { kind: "EVENTS_TALLY", config: { categories: ["CLUBS"], timeframe: "week" } },
  { kind: "CHAT_LATEST" },
  { kind: "EATS_FAVORITE", config: {} },
  { kind: "LILYPAD_LATEST", config: { categoryId: null } },
];
