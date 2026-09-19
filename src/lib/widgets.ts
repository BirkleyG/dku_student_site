import type { WidgetType } from "@prisma/client";

export const widgetCatalog: Record<
  WidgetType,
  { label: string; emoji: string; href: string; blurb: string }
> = {
  EVENTS: { label: "Upcoming Events", emoji: "🎉", href: "/events", blurb: "What's happening on campus this week." },
  DKU_EATS: { label: "DKU Eats", emoji: "🥟", href: "/eats", blurb: "Order student-cooked food and drinks." },
  SOCIAL: { label: "The Board", emoji: "💬", href: "/social", blurb: "What DKU is talking about right now." },
  NEWS: { label: "DKU News", emoji: "📰", href: "/news", blurb: "Fresh from the Lilypad." },
  WISDOM: { label: "DKU Wisdom", emoji: "🧭", href: "/wisdom", blurb: "Crowdsourced recs from people who know." },
  CLUBS: { label: "Clubs & Orgs", emoji: "🎭", href: "/clubs", blurb: "Find your people." },
};

export const defaultWidgetOrder: WidgetType[] = ["EVENTS", "DKU_EATS", "SOCIAL", "NEWS", "WISDOM", "CLUBS"];
