// DKU's real academic calendar, sourced from the official AY2026-2027
// Academic Calendar PDF (published by the Registrar, updated Jan 15 2026).
// Each semester is split into two 7-week sessions; Spring also has a
// one-week mini-term between its two sessions. Update this file each year
// once the next year's calendar PDF is published — there's no live feed for
// it.
import { campusDayKey } from "@/lib/datetime";

export type CalendarSession = {
  key: string;
  label: string;
  start: string; // ISO date, inclusive
  end: string; // ISO date, inclusive (last day of finals)
  weeks: number;
};

export type CalendarHoliday = {
  label: string;
  start: string;
  end: string;
};

export type AcademicYearCalendar = {
  label: string; // e.g. "2026-2027"
  sessions: CalendarSession[];
  holidays: CalendarHoliday[];
  commencement?: string;
};

export const ACADEMIC_CALENDAR: AcademicYearCalendar = {
  label: "2026-2027",
  sessions: [
    { key: "fall-s1", label: "Fall Session 1", start: "2026-08-24", end: "2026-10-22", weeks: 7 },
    { key: "fall-s2", label: "Fall Session 2", start: "2026-10-26", end: "2026-12-17", weeks: 7 },
    { key: "spring-s1", label: "Spring Session 1", start: "2027-01-11", end: "2027-03-11", weeks: 7 },
    { key: "spring-mini", label: "Spring Mini-Term", start: "2027-03-15", end: "2027-03-19", weeks: 1 },
    { key: "spring-s2", label: "Spring Session 2", start: "2027-03-22", end: "2027-05-13", weeks: 7 },
  ],
  holidays: [
    { label: "Mid-Autumn Festival", start: "2026-09-25", end: "2026-09-27" },
    { label: "National Day", start: "2026-10-01", end: "2026-10-11" },
    { label: "Spring Festival", start: "2027-02-05", end: "2027-02-14" },
    { label: "Qing Ming Festival", start: "2027-04-05", end: "2027-04-05" },
    { label: "Labor Day", start: "2027-05-01", end: "2027-05-03" },
  ],
  commencement: "2027-05-21",
};

export type CurrentSessionStatus =
  | { inSession: true; session: CalendarSession; week: number; day: number; totalWeeks: number }
  | { inSession: false; nextSession: CalendarSession | null; upcomingHoliday: CalendarHoliday | null };

// Today's *campus* date as a UTC-midnight Date, comparable with the ISO dates above.
function campusToday(now: Date): Date {
  return new Date(`${campusDayKey(now)}T00:00:00Z`);
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function getCurrentSessionStatus(now: Date = new Date(), calendar: AcademicYearCalendar = ACADEMIC_CALENDAR): CurrentSessionStatus {
  const today = campusToday(now);

  for (const session of calendar.sessions) {
    const start = new Date(session.start);
    const end = new Date(session.end);
    if (today >= start && today <= end) {
      const dayIndex = daysBetween(start, today); // 0-based day of session
      const week = Math.floor(dayIndex / 7) + 1;
      const day = (dayIndex % 7) + 1;
      return { inSession: true, session, week, day, totalWeeks: session.weeks };
    }
  }

  const nextSession =
    calendar.sessions
      .filter((s) => new Date(s.start) > today)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0] ?? null;

  const upcomingHoliday =
    calendar.holidays
      .filter((h) => new Date(h.end) >= today)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0] ?? null;

  return { inSession: false, nextSession, upcomingHoliday };
}

export function daysUntil(dateIso: string, now: Date = new Date()): number {
  const today = campusToday(now);
  return daysBetween(today, new Date(dateIso));
}

// ---------------------------------------------------------------------------
// Semesters. The calendar is stored as 7-week sessions; a semester is the
// group of sessions sharing a season prefix ("fall-*" / "spring-*"), and it
// ends on the last day of its final session. Reused by the end-of-semester
// popup and the upcoming "Semester in Review" feature.
// ---------------------------------------------------------------------------
export type CalendarSemester = {
  /** Stable key, e.g. "fall-2026-2027". Safe to persist per user. */
  key: string;
  label: string; // e.g. "Fall 2026-2027"
  start: string; // ISO date of first session start
  end: string; // ISO date, inclusive (last day of finals)
  sessions: CalendarSession[];
};

export function getSemesters(calendar: AcademicYearCalendar = ACADEMIC_CALENDAR): CalendarSemester[] {
  const groups = new Map<string, CalendarSession[]>();
  for (const s of calendar.sessions) {
    const season = s.key.split("-")[0];
    groups.set(season, [...(groups.get(season) ?? []), s]);
  }
  return Array.from(groups.entries())
    .map(([season, sessions]) => {
      const sorted = [...sessions].sort((a, b) => a.start.localeCompare(b.start));
      const name = season.charAt(0).toUpperCase() + season.slice(1);
      return {
        key: `${season}-${calendar.label}`,
        label: `${name} ${calendar.label}`,
        start: sorted[0].start,
        end: sorted[sorted.length - 1].end,
        sessions: sorted,
      };
    })
    .sort((a, b) => a.end.localeCompare(b.end));
}

function toUtcDay(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0, 10);
}

/** True once the day after the semester's last day has arrived. */
export function isSemesterEnded(semester: CalendarSemester, now: Date = new Date()): boolean {
  return toUtcDay(now) > semester.end;
}

/** The most recently ended semester, or null if none has ended yet. */
export function getLastEndedSemester(
  now: Date = new Date(),
  calendar: AcademicYearCalendar = ACADEMIC_CALENDAR,
): CalendarSemester | null {
  const ended = getSemesters(calendar).filter((s) => isSemesterEnded(s, now));
  return ended[ended.length - 1] ?? null;
}

/** Key of the semester containing `now` (or the last one that ended), for per-semester persistence. */
export function getSemesterKey(now: Date = new Date(), calendar: AcademicYearCalendar = ACADEMIC_CALENDAR): string | null {
  const day = toUtcDay(now);
  const current = getSemesters(calendar).find((s) => day >= s.start && day <= s.end);
  return (current ?? getLastEndedSemester(now, calendar))?.key ?? null;
}

/** The end date (ISO) of the semester in progress, or the next upcoming one; null if the calendar has none left. */
export function getCurrentSemesterEnd(
  now: Date = new Date(),
  calendar: AcademicYearCalendar = ACADEMIC_CALENDAR,
): string | null {
  const day = toUtcDay(now);
  return getSemesters(calendar).find((s) => s.end >= day)?.end ?? null;
}

/** How long after a semester ends the celebration is still worth showing. */
export const SEMESTER_CELEBRATION_WINDOW_DAYS = 45;

/** The ended semester to celebrate right now (ended, and still inside the window), else null. */
export function getSemesterToCelebrate(
  now: Date = new Date(),
  calendar: AcademicYearCalendar = ACADEMIC_CALENDAR,
): CalendarSemester | null {
  const last = getLastEndedSemester(now, calendar);
  if (!last) return null;
  const daysSince = daysBetween(new Date(last.end), new Date(toUtcDay(now)));
  return daysSince <= SEMESTER_CELEBRATION_WINDOW_DAYS ? last : null;
}
