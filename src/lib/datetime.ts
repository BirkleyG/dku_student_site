// One place for every date/time decision on the site. DKU is in Kunshan,
// China (Asia/Shanghai, UTC+8, no DST), and every date shown or entered must
// mean *campus* time no matter where the server runs (UTC on Vercel) or where
// the viewer's browser is. Never call date-fns `format`, `isToday`, `startOfDay`
// etc. on a raw instant elsewhere; go through these helpers instead.
import { format as dfFormat } from "date-fns";

export const CAMPUS_TIME_ZONE = "Asia/Shanghai";
const CAMPUS_OFFSET_MIN = 8 * 60;
const MS_PER_MIN = 60_000;
export const MS_PER_DAY = 24 * 60 * MS_PER_MIN;

/**
 * Shift an instant so its *local* getters (getHours, getDate, ...) read the
 * campus wall clock. Only for display / day math; never store or send the
 * result. Use `campusWallToDate` to go back.
 */
export function toCampus(d: Date | string | number): Date {
  const date = new Date(d);
  return new Date(date.getTime() + (CAMPUS_OFFSET_MIN + date.getTimezoneOffset()) * MS_PER_MIN);
}

/** Inverse of `toCampus`: a wall-clock Date (local getters) -> the real instant. */
export function campusWallToDate(wall: Date): Date {
  return new Date(
    Date.UTC(wall.getFullYear(), wall.getMonth(), wall.getDate(), wall.getHours(), wall.getMinutes(), wall.getSeconds(), wall.getMilliseconds()) -
      CAMPUS_OFFSET_MIN * MS_PER_MIN,
  );
}

/** date-fns `format`, but in campus time. */
export function formatCampus(d: Date | string | number, pattern: string): string {
  return dfFormat(toCampus(d), pattern);
}

/** Campus calendar day as "yyyy-MM-dd". */
export function campusDayKey(d: Date | string | number): string {
  return formatCampus(d, "yyyy-MM-dd");
}

export function isSameCampusDay(a: Date | string | number, b: Date | string | number): boolean {
  return campusDayKey(a) === campusDayKey(b);
}

export function isCampusToday(d: Date | string | number, now: Date = new Date()): boolean {
  return isSameCampusDay(d, now);
}

/** Same campus week (Sunday start, matching the calendar). */
export function isSameCampusWeek(a: Date | string | number, b: Date | string | number): boolean {
  const wa = toCampus(a);
  const wb = toCampus(b);
  const startA = new Date(wa.getFullYear(), wa.getMonth(), wa.getDate() - wa.getDay());
  const startB = new Date(wb.getFullYear(), wb.getMonth(), wb.getDate() - wb.getDay());
  return startA.getTime() === startB.getTime();
}

/** The instant of 00:00 campus time on the campus day containing `d`. */
export function campusStartOfDay(d: Date | string | number = new Date()): Date {
  const w = toCampus(d);
  return campusWallToDate(new Date(w.getFullYear(), w.getMonth(), w.getDate()));
}

/** The last millisecond of that campus day. */
export function campusEndOfDay(d: Date | string | number = new Date()): Date {
  return new Date(campusStartOfDay(d).getTime() + MS_PER_DAY - 1);
}

/** Add whole campus days (Shanghai has no DST, so this is exact). */
export function addCampusDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * MS_PER_DAY);
}

const LOCAL_DATETIME = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/;

/**
 * Parse what `<input type="datetime-local">` / `type="date"` produce
 * ("2026-10-01T14:30" or "2026-10-01") as campus time. Anything else (full ISO
 * strings with an offset) parses normally. Returns null when unparseable.
 */
export function parseCampusInput(value: string): Date | null {
  const m = LOCAL_DATETIME.exec(value.trim());
  if (m) {
    const [, y, mo, d, h, mi] = m;
    const date = new Date(Date.UTC(+y, +mo - 1, +d, h ? +h : 0, mi ? +mi : 0) - CAMPUS_OFFSET_MIN * MS_PER_MIN);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Value for `<input type="datetime-local">`, in campus time. */
export function toCampusDateTimeInput(d: Date | string | number): string {
  return formatCampus(d, "yyyy-MM-dd'T'HH:mm");
}

/** Value for `<input type="date">`, in campus time. */
export function toCampusDateInput(d: Date | string | number): string {
  return formatCampus(d, "yyyy-MM-dd");
}

/**
 * Format a plain calendar-date string (e.g. "2026-09-29" or "2026-09-29T08:00:00"
 * from a feed that reports site-local time) without any timezone shifting.
 */
export function formatDateOnly(value: string, pattern: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return "";
  return dfFormat(new Date(+m[1], +m[2] - 1, +m[3]), pattern);
}

/** "Wed, Oct 1" style date used across the site. */
export const DATE_SHORT = "MMM d";
export const DATE_LONG = "EEEE, MMMM d";
export const DATE_WITH_YEAR = "MMM d, yyyy";
export const TIME_SHORT = "h:mm a";

/** Event time range text, e.g. "Wednesday, October 1 · 2:00 PM–3:00 PM" or "... · All day". */
export function formatEventWhen(startsAt: Date | string, endsAt: Date | string, allDay: boolean): string {
  const day = formatCampus(startsAt, "EEEE, MMMM d, yyyy");
  if (allDay) return `${day} · All day`;
  const sameDay = isSameCampusDay(startsAt, endsAt);
  const end = sameDay ? formatCampus(endsAt, TIME_SHORT) : formatCampus(endsAt, "EEE, MMM d · h:mm a");
  return `${day} · ${formatCampus(startsAt, TIME_SHORT)}–${end}`;
}

export const DURATION_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 15, label: "15 minutes" },
  { minutes: 30, label: "30 minutes" },
  { minutes: 45, label: "45 minutes" },
  { minutes: 60, label: "1 hour" },
  { minutes: 90, label: "1.5 hours" },
  { minutes: 120, label: "2 hours" },
  { minutes: 180, label: "3 hours" },
  { minutes: 240, label: "4 hours" },
  { minutes: 360, label: "6 hours" },
  { minutes: 480, label: "8 hours" },
  { minutes: 720, label: "12 hours" },
  { minutes: 1440, label: "24 hours" },
];
export const DEFAULT_DURATION_MINUTES = 60;
