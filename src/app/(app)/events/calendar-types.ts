import type { EventCategory } from "@prisma/client";

export type ApiEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  posterUrl: string | null;
  startsAt: string;
  endsAt: string;
  category: EventCategory;
  host: { firstName: string; lastName: string };
  _count: { rsvps: number };
};

export type CalendarView = "month" | "week" | "day";
