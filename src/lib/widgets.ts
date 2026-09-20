import type { WidgetType } from "@prisma/client";
import { CalendarDays, UtensilsCrossed, MessagesSquare, Newspaper, Compass, Users2, type LucideIcon } from "lucide-react";

export const widgetCatalog: Record<
  WidgetType,
  { label: string; icon: LucideIcon; href: string; blurb: string }
> = {
  EVENTS: { label: "Upcoming Events", icon: CalendarDays, href: "/events", blurb: "What's happening on campus this week." },
  DKU_EATS: { label: "DKU Eats", icon: UtensilsCrossed, href: "/eats", blurb: "Order student-cooked food and drinks." },
  SOCIAL: { label: "The Board", icon: MessagesSquare, href: "/social", blurb: "What DKU is talking about right now." },
  NEWS: { label: "DKU News", icon: Newspaper, href: "/news", blurb: "Fresh from the Lilypad." },
  WISDOM: { label: "DKU Wisdom", icon: Compass, href: "/wisdom", blurb: "Crowdsourced recs from people who know." },
  CLUBS: { label: "Clubs & Orgs", icon: Users2, href: "/clubs", blurb: "Find your people." },
};

export const defaultWidgetOrder: WidgetType[] = ["EVENTS", "DKU_EATS", "SOCIAL", "NEWS", "WISDOM", "CLUBS"];
