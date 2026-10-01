// The unified calendar feed behind GET /api/calendar: campus events, the
// academic calendar, and (optionally) DKU Eats availability, as one list of
// plain items that can be served as JSON or as an .ics subscription.

import { prisma } from "@/lib/prisma";
import { ACADEMIC_CALENDAR } from "@/lib/academic-calendar";
import { campusDayKey, campusWallToDate } from "@/lib/datetime";
import { expandEatsAvailability } from "@/lib/eats-calendar";
import { fetchEatsVendorsForCalendar } from "@/lib/eats-live";

export const CALENDAR_SOURCES = ["events", "academic", "eats"] as const;
export type CalendarSource = (typeof CALENDAR_SOURCES)[number];

export type CalendarFeedItem = {
  id: string;
  source: CalendarSource;
  title: string;
  description: string;
  location: string;
  /** ISO instants. For all-day items, `end` is the exclusive end (midnight after the last day), campus time. */
  start: string;
  end: string;
  allDay: boolean;
  /** Event category key for `events`; "session" | "holiday" for `academic`; "hours" | "pickup" | "slots" for `eats`. */
  category: string;
  url: string;
};

export type CalendarFeed = {
  from: string;
  to: string;
  sources: CalendarSource[];
  /** Sources that were asked for but could not be loaded right now (e.g. DKU Eats unreachable). */
  unavailable: CalendarSource[];
  items: CalendarFeedItem[];
};

const campusMidnight = (iso: string, dayOffset = 0): Date => {
  const [y, m, d] = iso.split("-").map(Number);
  return campusWallToDate(new Date(y, m - 1, d + dayOffset));
};

export function parseSources(raw: string | null): CalendarSource[] {
  if (!raw) return [...CALENDAR_SOURCES];
  const wanted = raw.split(",").map((s) => s.trim());
  return CALENDAR_SOURCES.filter((s) => wanted.includes(s));
}

/** Accepts YYYY-MM-DD or a full ISO timestamp; returns the campus date. */
export function parseCampusDateParam(raw: string | null): string | null {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : campusDayKey(parsed);
}

export async function buildCalendarFeed(opts: {
  from: string;
  to: string;
  sources: CalendarSource[];
  baseUrl: string;
}): Promise<CalendarFeed> {
  const { from, to, sources, baseUrl } = opts;
  const rangeStart = campusMidnight(from);
  const rangeEnd = campusMidnight(to, 1);
  const items: CalendarFeedItem[] = [];
  const unavailable: CalendarSource[] = [];

  if (sources.includes("events")) {
    const events = await prisma.event.findMany({
      where: { approved: true, startsAt: { gte: rangeStart, lt: rangeEnd } },
      orderBy: { startsAt: "asc" },
    });
    for (const e of events) {
      items.push({
        id: `event:${e.id}`,
        source: "events",
        title: e.title,
        description: e.description,
        location: e.location,
        start: e.startsAt.toISOString(),
        end: e.endsAt.toISOString(),
        allDay: e.allDay,
        category: e.category,
        url: `${baseUrl}/events/${e.id}`,
      });
    }
  }

  if (sources.includes("academic")) {
    for (const s of ACADEMIC_CALENDAR.sessions) {
      if (s.end < from || s.start > to) continue;
      items.push({
        id: `academic:${s.key}`,
        source: "academic",
        title: s.label,
        description: `${s.weeks}-week session`,
        location: "",
        start: campusMidnight(s.start).toISOString(),
        end: campusMidnight(s.end, 1).toISOString(),
        allDay: true,
        category: "session",
        url: `${baseUrl}/events`,
      });
    }
    for (const h of ACADEMIC_CALENDAR.holidays) {
      if (h.end < from || h.start > to) continue;
      items.push({
        id: `academic:holiday:${h.start}`,
        source: "academic",
        title: h.label,
        description: "No classes",
        location: "",
        start: campusMidnight(h.start).toISOString(),
        end: campusMidnight(h.end, 1).toISOString(),
        allDay: true,
        category: "holiday",
        url: `${baseUrl}/events`,
      });
    }
  }

  if (sources.includes("eats")) {
    const vendors = await fetchEatsVendorsForCalendar();
    if (!vendors) {
      unavailable.push("eats");
    } else {
      for (const e of expandEatsAvailability(vendors, from, to)) {
        items.push({
          id: e.id,
          source: "eats",
          title: e.title,
          description: e.note,
          location: e.vendorName,
          start: e.startsAt.toISOString(),
          end: e.endsAt.toISOString(),
          allDay: e.allDay,
          category: e.kind,
          url: `${baseUrl}/eats`,
        });
      }
    }
  }

  items.sort((a, b) => a.start.localeCompare(b.start));
  return { from, to, sources, unavailable, items };
}

// ---- iCalendar (RFC 5545) ----

const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// Lines are limited to 75 octets; continuation lines start with one space.
const icsFold = (line: string): string => {
  const bytes = new TextEncoder();
  if (bytes.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  for (const ch of line) {
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes.encode(current + ch).length > limit) {
      parts.push(current);
      current = ch;
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.join("\r\n ");
};

const icsStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsDate = (iso: string) => campusDayKey(iso).replace(/-/g, "");

export function feedToIcs(feed: CalendarFeed, calendarName = "DKU Life"): string {
  const now = icsStamp(new Date());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DKU Life//Calendar//EN", "CALSCALE:GREGORIAN", `X-WR-CALNAME:${icsEscape(calendarName)}`, "X-WR-TIMEZONE:Asia/Shanghai"];
  for (const item of feed.items) {
    lines.push("BEGIN:VEVENT", `UID:${item.id}@dkulife`, `DTSTAMP:${now}`);
    if (item.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${icsDate(item.start)}`, `DTEND;VALUE=DATE:${icsDate(item.end)}`);
    } else {
      lines.push(`DTSTART:${icsStamp(new Date(item.start))}`, `DTEND:${icsStamp(new Date(item.end))}`);
    }
    lines.push(`SUMMARY:${icsEscape(item.title)}`);
    if (item.description) lines.push(`DESCRIPTION:${icsEscape(item.description)}`);
    if (item.location) lines.push(`LOCATION:${icsEscape(item.location)}`);
    lines.push(`URL:${item.url}`, `CATEGORIES:${icsEscape(item.source.toUpperCase())}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(icsFold).join("\r\n") + "\r\n";
}
