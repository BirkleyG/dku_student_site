// Port of DKU Eats' opening-hours logic (birkleyg/eats functions/src/hours.ts)
// so DKU Life counts a kitchen as "open" exactly the way DKU Eats does. Keep
// in sync if that file changes.

const CAMPUS_UTC_OFFSET_MINUTES = 8 * 60; // Kunshan, UTC+8, no DST
const WEEK_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function campusNow(now: Date): Date {
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + CAMPUS_UTC_OFFSET_MINUTES * 60000);
}

function toMinutes(val: unknown): number | null {
  if (typeof val !== "string" || !val) return null;
  const [h, m] = val.split(":").map((n) => Number(n));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function isMinutesInRange(nowMin: number, start: number | null, end: number | null): boolean {
  if (start === null || end === null) return false;
  if (start === end) return true;
  if (start < end) return nowMin >= start && nowMin <= end;
  return nowMin >= start || nowMin <= end; // overnight
}

export function isOpenNow(hours: unknown, now: Date = new Date()): boolean {
  if (!hours) return true;
  const local = campusNow(now);
  const nowMin = local.getHours() * 60 + local.getMinutes();

  if (typeof hours === "string") {
    const lower = hours.toLowerCase();
    if (lower.includes("closed")) return false;
    const range = hours.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (range) return isMinutesInRange(nowMin, toMinutes(range[1]), toMinutes(range[2]));
    if (lower.includes("opens")) {
      const openMatch = hours.match(/(\d{1,2}:\d{2})/);
      if (openMatch) {
        const start = toMinutes(openMatch[1]);
        return start === null ? true : nowMin >= start;
      }
    }
    return true;
  }

  if (typeof hours === "object") {
    const h = (hours as Record<string, { open?: boolean; from?: string; to?: string }>)[WEEK_KEYS[local.getDay()]];
    if (!h || !h.open) return false;
    return isMinutesInRange(nowMin, toMinutes(h.from), toMinutes(h.to));
  }

  return true;
}
