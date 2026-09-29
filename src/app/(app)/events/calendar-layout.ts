import { toCampus } from "@/lib/datetime";
import type { ApiEvent } from "./calendar-types";

export type PositionedEvent = {
  event: ApiEvent;
  top: number;
  height: number;
  left: number;
  width: number;
};

/**
 * Lays out one day's timed events into non-overlapping columns (same idea
 * Google Calendar uses): cluster events that overlap in time, then greedily
 * pack each cluster into as few side-by-side columns as it needs.
 */
export function layoutDayEvents(dayEvents: ApiEvent[], hourHeight: number): PositionedEvent[] {
  const sorted = [...dayEvents].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const clusters: ApiEvent[][] = [];
  let current: ApiEvent[] = [];
  let currentEnd = -Infinity;
  for (const ev of sorted) {
    const start = new Date(ev.startsAt).getTime();
    if (current.length === 0 || start < currentEnd) {
      current.push(ev);
      currentEnd = Math.max(currentEnd, new Date(ev.endsAt).getTime());
    } else {
      clusters.push(current);
      current = [ev];
      currentEnd = new Date(ev.endsAt).getTime();
    }
  }
  if (current.length) clusters.push(current);

  const positioned: PositionedEvent[] = [];
  for (const cluster of clusters) {
    const columnEndTimes: number[] = [];
    const columnOf = new Map<string, number>();

    for (const ev of cluster) {
      const start = new Date(ev.startsAt).getTime();
      const end = new Date(ev.endsAt).getTime();
      const freeColumn = columnEndTimes.findIndex((endsAt) => endsAt <= start);
      if (freeColumn === -1) {
        columnEndTimes.push(end);
        columnOf.set(ev.id, columnEndTimes.length - 1);
      } else {
        columnEndTimes[freeColumn] = end;
        columnOf.set(ev.id, freeColumn);
      }
    }

    const totalColumns = columnEndTimes.length;
    for (const ev of cluster) {
      const start = toCampus(ev.startsAt);
      const end = toCampus(ev.endsAt);
      const startMinutes = start.getHours() * 60 + start.getMinutes();
      // An event running past midnight is clipped to the end of its start day.
      const sameDay = start.toDateString() === end.toDateString();
      const endMinutes = Math.min(1440, Math.max(startMinutes + 20, sameDay ? end.getHours() * 60 + end.getMinutes() : 1440));
      const width = 100 / totalColumns;
      positioned.push({
        event: ev,
        top: (startMinutes / 60) * hourHeight,
        height: ((endMinutes - startMinutes) / 60) * hourHeight,
        left: (columnOf.get(ev.id) ?? 0) * width,
        width,
      });
    }
  }

  return positioned;
}
