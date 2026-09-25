"use client";

import { format, isSameDay, isSameMonth, isToday, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { EVENT_CATEGORY_MAP } from "@/lib/event-categories";
import { HappeningNowDot } from "@/components/motion/HappeningNowDot";
import { useT } from "@/lib/i18n/client";
import type { ApiEvent } from "./calendar-types";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE = 3;

type Props = {
  anchor: Date;
  events: ApiEvent[];
  selectedDay: Date | null;
  onSelectDay: (day: Date) => void;
};

export function MonthGrid({ anchor, events, selectedDay, onSelectDay }: Props) {
  const t = useT("events");
  const gridStart = startOfWeek(startOfMonth(anchor));
  const gridEnd = endOfWeek(endOfMonth(anchor));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="overflow-hidden rounded-3xl border border-ink/10 bg-paper">
      <div className="grid grid-cols-7 border-b border-ink/10">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-2 py-2.5 text-center text-[11px] uppercase tracking-wide text-ink/45">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEvents = events
            .filter((e) => isSameDay(new Date(e.startsAt), day))
            .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
          const inMonth = isSameMonth(day, anchor);
          const selected = selectedDay ? isSameDay(day, selectedDay) : false;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              className={`focus-ring flex min-h-[104px] flex-col items-stretch border-b border-l border-ink/10 p-1.5 text-left [&:nth-child(7n+1)]:border-l-0 ${
                inMonth ? "bg-paper" : "bg-paper-dim/40"
              } ${selected ? "ring-2 ring-inset ring-gold" : "hover:bg-paper-dim/60"}`}
            >
              <span
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isToday(day) ? "bg-ink text-white" : inMonth ? "text-ink/70" : "text-ink/30"
                }`}
              >
                {format(day, "d")}
              </span>

              <span className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                {dayEvents.slice(0, MAX_VISIBLE).map((event) => {
                  const meta = EVENT_CATEGORY_MAP[event.category];
                  return (
                    <span
                      key={event.id}
                      className="flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-[10px] leading-tight"
                      style={{ backgroundColor: meta.tint, color: meta.color }}
                    >
                      <HappeningNowDot startsAt={event.startsAt} endsAt={event.endsAt} />
                      <span className="truncate">{event.title}</span>
                    </span>
                  );
                })}
                {dayEvents.length > MAX_VISIBLE ? (
                  <span className="px-1.5 text-[10px] text-ink/40">{t("moreCount", { n: dayEvents.length - MAX_VISIBLE })}</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
