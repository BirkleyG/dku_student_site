// Turns DKU Eats kitchens into calendar entries. Pure (no fetching, no React)
// so the API route and tests can share it. Mirrors DKU Eats' own week view
// (src/lib/schedule.js buildWeek): restaurants follow weekly hours; bakeries
// show each upcoming bake's pickup window.

import { campusWallToDate } from "@/lib/datetime";

const WEEK_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type EatsVendorRecord = {
  id: string;
  slug: string;
  name: string;
  kind: "restaurant" | "bakery";
  /** { Mon: { open, from: "HH:MM", to: "HH:MM" }, ... } in campus time (restaurants). */
  hours: unknown;
  acceptingOrders: boolean;
};

/** A bakery "bake": a pre-order window with one pickup date, time and place. */
export type EatsDropRecord = {
  id: string;
  vendorId: string;
  title: string;
  pickupDate: string;
  pickupStart: string;
  pickupEnd: string;
  location: string;
  status: string;
  orderDeadline: string | null;
};

export type EatsCatalog = { vendors: EatsVendorRecord[]; drops: EatsDropRecord[] };

export type EatsCalendarItem = {
  id: string;
  vendorId: string;
  vendorSlug: string;
  vendorName: string;
  kind: "hours" | "pickup";
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

export function expandEatsAvailability(catalog: EatsCatalog, from: string, to: string): EatsCalendarItem[] {
  const items: EatsCalendarItem[] = [];
  const dates = campusDateRange(from, to);
  const byId = new Map(catalog.vendors.map((v) => [v.id, v]));

  for (const vendor of catalog.vendors) {
    if (vendor.kind !== "restaurant" || !vendor.hours || typeof vendor.hours !== "object") continue;
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
        vendorSlug: vendor.slug,
        vendorName: vendor.name,
        kind: "hours",
        title: `${vendor.name} · open`,
        startsAt: campusInstant(iso, start),
        endsAt: campusInstant(iso, end, minutesOf(end) <= minutesOf(start) ? 1 : 0),
        allDay: false,
        note: `Open ${clock12(start)}–${clock12(end)}`,
      });
    }
  }

  for (const drop of catalog.drops) {
    const vendor = byId.get(drop.vendorId);
    if (!vendor || drop.pickupDate < from || drop.pickupDate > to) continue;
    const start = parseHHMM(drop.pickupStart);
    const end = parseHHMM(drop.pickupEnd);
    if (!start || !end) continue;
    const where = drop.location ? ` at ${drop.location}` : "";
    items.push({
      id: `eats:${vendor.id}:${drop.id}:pickup`,
      vendorId: vendor.id,
      vendorSlug: vendor.slug,
      vendorName: vendor.name,
      kind: "pickup",
      title: `${vendor.name} · ${drop.title || "bake"} pickup`,
      startsAt: campusInstant(drop.pickupDate, start),
      endsAt: campusInstant(drop.pickupDate, end, minutesOf(end) <= minutesOf(start) ? 1 : 0),
      allDay: false,
      note: `Pick up ${clock12(start)}–${clock12(end)}${where}. Pre-order on DKU Eats.`,
    });
  }

  return items.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}
