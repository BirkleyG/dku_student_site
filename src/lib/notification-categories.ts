import type { NotificationCategory } from "@prisma/client";

type CategoryMeta = {
  key: NotificationCategory;
  label: string;
  description: string;
};

// NOTE for reconciliation with "[Notifications] Push notification
// infrastructure & delivery": these four categories match the ones named in
// this card's own Details section (events, posts/community, recs, orders).
// If that card's schema ends up naming categories differently, rename the
// `NotificationCategory` enum values in prisma/schema.prisma and update this
// list to match — everything else in this file reads from here.
export const NOTIFICATION_CATEGORIES: CategoryMeta[] = [
  {
    key: "EVENTS",
    label: "Events",
    description: "RSVPs, reminders, and updates for events you're going to.",
  },
  {
    key: "MESSAGES",
    label: "Chat",
    description: "New messages and thread replies in Chat.",
  },
  {
    key: "RECOMMENDATIONS",
    label: "Recommendations",
    description: "New Wisdom recommendations and votes on topics you follow.",
  },
  {
    key: "ORDERS",
    label: "Orders",
    description: "Status updates for your DKU Eats orders.",
  },
];

export const NOTIFICATION_CATEGORY_KEYS: NotificationCategory[] = NOTIFICATION_CATEGORIES.map((c) => c.key);

export const NOTIFICATION_CATEGORY_MAP: Record<NotificationCategory, CategoryMeta> = Object.fromEntries(
  NOTIFICATION_CATEGORIES.map((c) => [c.key, c]),
) as Record<NotificationCategory, CategoryMeta>;
