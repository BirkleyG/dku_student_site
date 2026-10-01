// Turns DKU Eats vendor settings into calendar entries. Pure (no Firestore, no
// React) so the API route and tests can share it. Mirrors DKU Eats' own
// src/hours/hours.js: sit-down kitchens follow weekly hours; "weekly pickup"
// cafes (order all week, collect on one day) are shown on their pickup day.

import { campusWallToDate } from "@/lib/datetime";

const WEEK_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type EatsVendorRecord = {
  id: string;
  name: string;
  hours: unknown;
  serviceType?: unknown;
  /** Weekly-pickup schedule: { day: "Sat", from: "12:00", to: "14:00", pausedWeeks: ["2026-10-10"] } */
  weeklyPickup?: unknown;
  /** Daily pickup slots (existing "takeout" service type). */
  quotas?: unknown;
  quotaSystemEnabled?: unknown;
};

export type EatsCalendarItem = {
  id: string;
  vendorId: string;
  vendorName: string;
  kind: "hours" | "pickup" | "slots";
  title: string;
  startsAt: Date;
  endsAt: Date;
  allDay: boolean;
  note: string;
};

type DayHours = { open?: boolean; from?: string; to?: string };

const isoToParts = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
};

const addDays = (iso: string, days: number): string => {
  const { y, m, d } = isoToParts(iso);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

const weekdayOf = (iso: string): number => {
  const { y, m, d } = isoToParts(iso);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

const parseHHMM = (v: unknown): [number, number] | null => {
  if (typeof v !== "string") return null;
  const match = v.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const min = Number(match[2]);
  return h > 23 || min > 59 ? null : [h, min];
};

const minutesOf = (t: [number, number]) => t[0] * 60 + t[1];

// `iso` + clock time in campus time -> real instant. `dayOffset` handles overnight windows.
const campusInstant = (iso: string, hhmm: [number, number], dayOffset = 0): Date => {
  const { y, m, d } = isoToParts(iso);
  return campusWallToDate(new Date(y, m - 1, d + dayOffset, hhmm[0], hhmm[1]));
};

const clock12 = ([h, m]: [number, number]) => {
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, "0")}${suffix}`;
};

/** Every campus date (YYYY-MM-DD) from `from` to `to`, inclusive. Capped so a bad range can't run away. */
export function campusDateRange(from: string, to: string, maxDays = 62): string[] {
  const out: string[] = [];
  for (let iso = from; iso <= to && out.length < maxDays; iso = addDays(iso, 1)) out.push(iso);
  return out;
}

export function expandEatsAvailability(vendors: EatsVendorRecord[], from: string, to: string): EatsCalendarItem[] {
  const items: EatsCalendarItem[] = [];
  const dates = campusDateRange(from, to);

  for (const vendor of vendors) {
    if (vendor.serviceType === "weekly") {
      const cfg = (vendor.weeklyPickup ?? {}) as { day?: string; from?: string; to?: string; pausedWeeks?: unknown };
      const dayIndex = WEEK_KEYS.indexOf(String(cfg.day));
      if (dayIndex < 0) continue;
      const paused = new Set(Array.isArray(cfg.pausedWeeks) ? cfg.pausedWeeks.map(String) : []);
      const start = parseHHMM(cfg.from);
      const end = parseHHMM(cfg.to);
      const timed = start !== null && end !== null;
      for (const iso of dates) {
        if (weekdayOf(iso) !== dayIndex || paused.has(iso)) continue;
        items.push({
          id: `eats:${vendor.id}:${iso}:pickup`,
          vendorId: vendor.id,
          vendorName: vendor.name,
          kind: "pickup",
          title: `${vendor.name} · pickup day`,
          startsAt: timed ? campusInstant(iso, start) : campusInstant(iso, [0, 0]),
          endsAt: timed ? campusInstant(iso, end, minutesOf(end) <= minutesOf(start) ? 1 : 0) : campusInstant(iso, [0, 0], 1),
          allDay: !timed,
          note: timed ? `Pick up ${clock12(start)}–${clock12(end)}. Order any day this week.` : "Order any day this week, pick up today.",
        });
      }
      continue;
    }

    if (vendor.serviceType === "takeout") {
      const slots = (Array.isArray(vendor.quotas) ? vendor.quotas : [])
        .filter((q): q is { time: string; isActive: true } => Boolean(q) && typeof q === "object" && (q as { isActive?: boolean }).isActive === true)
        .map((q) => parseHHMM(q.time))
        .filter((t): t is [number, number] => t !== null)
        .sort((a, b) => minutesOf(a) - minutesOf(b));
      if (!vendor.quotaSystemEnabled || slots.length === 0) continue;
      const first = slots[0];
      const last = slots[slots.length - 1];
      for (const iso of dates) {
        items.push({
          id: `eats:${vendor.id}:${iso}:slots`,
          vendorId: vendor.id,
          vendorName: vendor.name,
          kind: "slots",
          title: `${vendor.name} · pickup slots`,
          startsAt: campusInstant(iso, first),
          endsAt: campusInstant(iso, last),
          allDay: false,
          note: `Pickup slots ${clock12(first)}–${clock12(last)}`,
        });
      }
      continue;
    }

    // Sit-down: structured weekly hours only. Legacy free-text hours can't be placed on a day.
    if (!vendor.hours || typeof vendor.hours !== "object") continue;
    const hours = vendor.hours as Record<string, DayHours>;
    for (const iso of dates) {
      const day = hours[WEEK_KEYS[weekdayOf(iso)]];
      if (!day?.open) continue;
      const start = parseHHMM(day.from);
      const end = parseHHMM(day.to);
      if (!start || !end) continue;
      items.push({
        id: `eats:${vendor.id}:${iso}:hours`,
        vendorId: vendor.id,
        vendorName: vendor.name,
        kind: "hours",
        title: `${vendor.name} · open`,
        startsAt: campusInstant(iso, start),
        endsAt: campusInstant(iso, end, minutesOf(end) < minutesOf(start) ? 1 : 0),
        allDay: false,
        note: `Open ${clock12(start)}–${clock12(end)}`,
      });
    }
  }

  return items.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}
