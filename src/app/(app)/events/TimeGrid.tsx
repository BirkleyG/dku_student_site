"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { format, isSameDay, isToday, setHours } from "date-fns";
import { EVENT_CATEGORY_MAP } from "@/lib/event-categories";
import { HappeningNowDot } from "@/components/motion/HappeningNowDot";
import { layoutDayEvents } from "./calendar-layout";
import type { ApiEvent } from "./calendar-types";

const HOUR_HEIGHT = 56;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

type Props = {
  days: Date[];
  events: ApiEvent[];
  onDayHeaderClick?: (day: Date) => void;
};

export function TimeGrid({ days, events, onDayHeaderClick }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 7 * HOUR_HEIGHT });
  }, [days]);

  return (
    <div className="overflow-hidden rounded-3xl border border-ink/10 bg-paper">
      {days.length > 1 ? (
        <div className="flex border-b border-ink/10" style={{ paddingLeft: 56 }}>
          {days.map((day) => (
            <button
              key={day.toISOString()}
              onClick={() => onDayHeaderClick?.(day)}
              className="focus-ring flex-1 border-l border-ink/10 py-3 text-center first:border-l-0 hover:bg-paper-dim"
            >
              <p className="text-[11px] uppercase tracking-wide text-ink/45">{format(day, "EEE")}</p>
              <p
                className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full font-display text-lg ${
                  isToday(day) ? "bg-ink text-white" : "text-ink"
                }`}
              >
                {format(day, "d")}
              </p>
            </button>
          ))}
        </div>
      ) : null}

      <div ref={scrollRef} className="max-h-[620px] overflow-y-auto">
        <div className="relative flex" style={{ height: HOUR_HEIGHT * 24 }}>
          <div className="w-14 shrink-0">
            {HOURS.map((h) => (
              <div key={h} style={{ height: HOUR_HEIGHT }} className="relative">
                {h > 0 ? (
                  <span className="absolute -top-2 right-2 text-[11px] text-ink/35">{format(setHours(new Date(), h), "h a")}</span>
                ) : null}
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayEvents = events.filter((e) => isSameDay(new Date(e.startsAt), day));
            const positioned = layoutDayEvents(dayEvents, HOUR_HEIGHT);
            return (
              <div key={day.toISOString()} className="relative flex-1 border-l border-ink/10">
                {HOURS.map((h) => (
                  <div key={h} style={{ height: HOUR_HEIGHT }} className="border-b border-ink/[0.06]" />
                ))}

                {positioned.map(({ event, top, height, left, width }) => {
                  const meta = EVENT_CATEGORY_MAP[event.category];
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="focus-ring absolute overflow-hidden rounded-lg px-2 py-1 text-left text-xs leading-tight shadow-sm transition-opacity hover:opacity-90"
                      style={{
                        top,
                        height: Math.max(height, 20),
                        left: `calc(${left}% + 2px)`,
                        width: `calc(${width}% - 4px)`,
                        backgroundColor: meta.tint,
                        borderLeft: `3px solid ${meta.color}`,
                        color: meta.color,
                      }}
                    >
                      <span className="flex items-center gap-1 truncate font-medium">
                        <HappeningNowDot startsAt={event.startsAt} endsAt={event.endsAt} />
                        {event.title}
                      </span>
                      <span className="block truncate opacity-80">{format(new Date(event.startsAt), "h:mm a")}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
