// Port of DKU Eats' opening-hours logic (birkleyg/eats src/lib/time.js,
// `isOpenNow`) so DKU Life counts a kitchen as "open" exactly the way DKU Eats
// does. Keep in sync if that file changes.
//
// Hours are { Mon: { open, from: "HH:MM", to: "HH:MM" }, ... } in campus time.
// The closing minute is exclusive, from === to means 24h, and a window that
// ends before it starts runs past midnight.

import { toCampus } from "@/lib/datetime";

const WEEK_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DayHours = { open?: boolean; from?: string; to?: string };
type Window = { fromMin: number; toMin: number };

function toMinutes(val: unknown): number | null {
  if (typeof val !== "string") return null;
  const match = val.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function dayWindow(hours: unknown, dayIndex: number): Window | null {
  if (!hours || typeof hours !== "object") return null;
  const h = (hours as Record<string, DayHours | undefined>)[WEEK_KEYS[dayIndex]];
  if (!h?.open) return null;
  const fromMin = toMinutes(h.from);
  const toMin = toMinutes(h.to);
  return fromMin === null || toMin === null ? null : { fromMin, toMin };
}

function inWindow(win: Window | null, minutes: number): boolean {
  if (!win) return false;
  if (win.fromMin === win.toMin) return true;
  if (win.fromMin < win.toMin) return minutes >= win.fromMin && minutes < win.toMin;
  return minutes >= win.fromMin || minutes < win.toMin;
}

export function isOpenNow(hours: unknown, now: Date = new Date()): boolean {
  const local = toCampus(now);
  const minutes = local.getHours() * 60 + local.getMinutes();
  const day = local.getDay();
  if (inWindow(dayWindow(hours, day), minutes)) return true;
  // Yesterday's overnight window spilling past midnight.
  const yesterday = dayWindow(hours, (day + 6) % 7);
  return Boolean(yesterday && yesterday.fromMin > yesterday.toMin && minutes < yesterday.toMin);
}
