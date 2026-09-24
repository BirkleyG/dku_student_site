import type { WidgetType, WidgetSize } from "@prisma/client";
import {
  CalendarDays,
  UtensilsCrossed,
  MessagesSquare,
  Newspaper,
  Compass,
  Users2,
  ShoppingBag,
  Landmark,
  type LucideIcon,
} from "lucide-react";

export type WidgetApp = WidgetType;
export type { WidgetSize };

export type AppMeta = {
  label: string;
  icon: LucideIcon;
  href: string;
  blurb: string;
};

export const appCatalog: Record<WidgetApp, AppMeta> = {
  EVENTS: { label: "Events", icon: CalendarDays, href: "/events", blurb: "What's happening on campus this week." },
  DKU_EATS: { label: "DKU Eats", icon: UtensilsCrossed, href: "/eats", blurb: "Order student-cooked food and drinks." },
  SOCIAL: { label: "The Board", icon: MessagesSquare, href: "/social", blurb: "What DKU is talking about right now." },
  NEWS: { label: "DKU News", icon: Newspaper, href: "/news", blurb: "Fresh from the Lilypad." },
  WISDOM: { label: "DKU Wisdom", icon: Compass, href: "/wisdom", blurb: "Crowdsourced recs from people who know." },
  CLUBS: { label: "Clubs & Orgs", icon: Users2, href: "/clubs", blurb: "Find your people." },
  MARKETPLACE: { label: "Marketplace", icon: ShoppingBag, href: "/marketplace", blurb: "Buy and sell with your dorm mates." },
  SLB: { label: "SLB Board", icon: Landmark, href: "/slb", blurb: "Talk to your student reps." },
};

export const appOrder: WidgetApp[] = [
  "EVENTS",
  "DKU_EATS",
  "SOCIAL",
  "NEWS",
  "WISDOM",
  "CLUBS",
  "MARKETPLACE",
  "SLB",
];

export const sizeOrder: WidgetSize[] = ["SMALL", "MEDIUM", "LARGE"];

export const sizeSpec: Record<WidgetSize, { label: string; className: string; itemCount: number }> = {
  SMALL: { label: "Small", className: "col-span-1 row-span-1", itemCount: 1 },
  MEDIUM: { label: "Medium", className: "col-span-2 row-span-1", itemCount: 2 },
  LARGE: { label: "Large", className: "col-span-2 row-span-2", itemCount: 4 },
};

/** A widget "instance" placed on someone's dashboard. */
export type WidgetInstance = {
  id: string;
  app: WidgetApp;
  size: WidgetSize;
};

export function widgetKey(app: WidgetApp, size: WidgetSize) {
  return `${app}_${size}`;
}

export const defaultLayout: Array<{ app: WidgetApp; size: WidgetSize }> = [
  { app: "EVENTS", size: "LARGE" },
  { app: "DKU_EATS", size: "MEDIUM" },
  { app: "SOCIAL", size: "SMALL" },
  { app: "WISDOM", size: "MEDIUM" },
  { app: "NEWS", size: "SMALL" },
  { app: "CLUBS", size: "SMALL" },
];
