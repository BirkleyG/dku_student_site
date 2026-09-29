"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { format, setHours } from "date-fns";
import { campusDayKey, formatCampus } from "@/lib/datetime";
import { useT } from "@/lib/i18n/client";
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
  const t = useT("events");
  const todayKey = campusDayKey(new Date());
  const businessHoursRef = useRef<HTMLDivElement>(null);
  const daysKey = days.map((d) => format(d, "yyyy-MM-dd")).join(",");
  // Scroll is owned by Lenis (see SmoothScroll.tsx) wherever it's mounted —
  // this is null under prefers-reduced-motion or on a full-bleed route, so
  // fall back to native scroll there.
  const lenis = useLenis();

  // Land on business hours instead of midnight, without trapping the grid
  // in its own tiny scrollbox — this scrolls the page itself.
  useEffect(() => {
    const el = businessHoursRef.current;
    if (!el) return;
    // Switching Day/Week/Month is in-page client state, not a route change,
    // so LenisRouteResize (SmoothScroll.tsx) never fires for it — Lenis is
    // left with whatever scroll limit it measured for the *previous* view
    // (e.g. the short Month view) and silently refuses to scroll past it.
    // Resize first so it knows this view's real (taller) height.
    lenis?.resize();
    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 73;
    const top = el.getBoundingClientRect().top + window.scrollY - headerH - 16;
    const target = Math.max(top, 0);
    if (lenis) lenis.scrollTo(target, { immediate: true });
    else window.scrollTo({ top: target });
  }, [daysKey, lenis]);

  return (
    <div className="overflow-hidden rounded-3xl border border-ink/10 bg-paper">
      <div className="flex border-b border-ink/10" style={{ paddingLeft: 56 }}>
        {days.map((day) => (
          <button
            key={format(day, "yyyy-MM-dd")}
            onClick={() => onDayHeaderClick?.(day)}
            className={`focus-ring flex-1 border-l border-ink/10 py-3 text-center first:border-l-0 hover:bg-paper-dim ${
              onDayHeaderClick ? "" : "cursor-default"
            }`}
          >
            <p className="text-[11px] uppercase tracking-wide text-ink/45">{format(day, "EEE")}</p>
            <p
              className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full font-display text-lg ${
                format(day, "yyyy-MM-dd") === todayKey ? "bg-ink text-white" : "text-ink"
              }`}
            >
              {format(day, "d")}
            </p>
          </button>
        ))}
      </div>

      {events.some((e) => e.allDay) ? (
        <div className="flex border-b border-ink/10" style={{ paddingLeft: 56 }}>
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const allDayEvents = events.filter((e) => e.allDay && campusDayKey(e.startsAt) === key);
            return (
              <div key={key} className="min-w-0 flex-1 space-y-1 border-l border-ink/10 p-1 first:border-l-0">
                {allDayEvents.map((event) => {
                  const meta = EVENT_CATEGORY_MAP[event.category];
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      title={`${event.title} · ${t("allDayShort")}`}
                      className="focus-ring block truncate rounded px-1.5 py-0.5 text-[11px] font-medium leading-tight hover:opacity-90"
                      style={{ backgroundColor: meta.tint, color: meta.color, borderLeft: `3px solid ${meta.color}` }}
                    >
                      {event.title}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="relative flex" style={{ height: HOUR_HEIGHT * 24 }}>
        <div className="w-14 shrink-0">
          {HOURS.map((h) => (
            <div
              key={h}
              ref={h === 7 ? businessHoursRef : undefined}
              style={{ height: HOUR_HEIGHT }}
              className="relative"
            >
              {h > 0 ? (
                <span className="absolute -top-2 right-2 text-[11px] text-ink/35">{format(setHours(new Date(), h), "h a")}</span>
              ) : null}
            </div>
          ))}
        </div>

        {days.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayEvents = events.filter((e) => !e.allDay && campusDayKey(e.startsAt) === dayKey);
          const positioned = layoutDayEvents(dayEvents, HOUR_HEIGHT);
          return (
            <div key={dayKey} className="relative flex-1 border-l border-ink/10">
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
                    <span className="block truncate opacity-80">{formatCampus(event.startsAt, "h:mm a")}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
