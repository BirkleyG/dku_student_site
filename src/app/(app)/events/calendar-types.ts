import type { EventCategory, EventKind } from "@prisma/client";

export type ApiEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  posterUrl: string | null;
  startsAt: string;
  endsAt: string;
  category: EventCategory;
  /** Set for DKU Eats availability entries pulled from /api/calendar; absent for real events. */
  source?: "eats";
  allDay: boolean;
  kind: EventKind;
  host: { firstName: string; lastName: string };
  _count: { rsvps: number };
};

export type CalendarView = "month" | "week" | "day";
