"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence } from "framer-motion";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import type { EventCategory } from "@prisma/client";
import { MonthGrid } from "./MonthGrid";
import { TimeGrid } from "./TimeGrid";
import { DayAgenda } from "./DayAgenda";
import { CategoryFilterPanel } from "./CategoryFilterPanel";
import { EVENT_CATEGORIES } from "@/lib/event-categories";
import type { ApiEvent, CalendarView } from "./calendar-types";

const STORAGE_KEY = "dku-life-hidden-event-categories";
const ALL_CATEGORY_KEYS = EVENT_CATEGORIES.map((c) => c.key);

type Props = {
  loggedIn: boolean;
  initialHiddenCategories: EventCategory[];
};

export function Calendar({ loggedIn, initialHiddenCategories }: Props) {
  const [view, setView] = useState<CalendarView>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [isPending, startTransition] = useTransition();
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  // Matches the server-rendered set exactly so hydration has nothing to
  // reconcile; guests' localStorage prefs (which don't exist on the server)
  // are layered in right after mount, below.
  const [hidden, setHidden] = useState<Set<EventCategory>>(() => new Set(initialHiddenCategories));

  useEffect(() => {
    if (loggedIn) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from an external store (localStorage), not derivable from props/state.
      if (raw) setHidden(new Set(JSON.parse(raw)));
    } catch {
      // ignore malformed/inaccessible storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- guest-only, one-time hydration; loggedIn/initialHiddenCategories don't change after mount.
  }, []);

  const { from, to } = useMemo(() => {
    if (view === "month") return { from: startOfWeek(startOfMonth(anchor)), to: endOfWeek(endOfMonth(anchor)) };
    if (view === "week") return { from: startOfWeek(anchor), to: endOfWeek(anchor) };
    return { from: anchor, to: addDays(anchor, 1) };
  }, [view, anchor]);

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      const res = await fetch(`/api/events?from=${from.toISOString()}&to=${to.toISOString()}`);
      const data = await res.json();
      if (!cancelled) setEvents(data.events ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const visibleEvents = useMemo(() => events.filter((e) => !hidden.has(e.category)), [events, hidden]);

  const persist = useCallback(
    (next: Set<EventCategory>) => {
      if (loggedIn) {
        fetch("/api/user/calendar-preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hiddenCategories: Array.from(next) }),
        }).catch(() => {});
      } else {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
        } catch {
          // ignore
        }
      }
    },
    [loggedIn],
  );

  const toggleCategory = (key: EventCategory) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      persist(next);
      return next;
    });
  };

  const showAll = () => {
    const next = new Set<EventCategory>();
    setHidden(next);
    persist(next);
  };

  const hideAll = () => {
    const next = new Set(ALL_CATEGORY_KEYS);
    setHidden(next);
    persist(next);
  };

  const goToday = () => {
    setAnchor(new Date());
    setSelectedDay(null);
  };

  const goPrev = () => {
    setSelectedDay(null);
    setAnchor((d) => (view === "month" ? subMonths(d, 1) : view === "week" ? subWeeks(d, 1) : addDays(d, -1)));
  };

  const goNext = () => {
    setSelectedDay(null);
    setAnchor((d) => (view === "month" ? addMonths(d, 1) : view === "week" ? addWeeks(d, 1) : addDays(d, 1)));
  };

  const label =
    view === "month" ? format(anchor, "MMMM yyyy") : view === "week" ? `${format(from, "MMM d")} – ${format(to, "MMM d, yyyy")}` : format(anchor, "EEEE, MMMM d");

  const selectedDayEvents = useMemo(
    () => (selectedDay ? visibleEvents.filter((e) => isSameDay(new Date(e.startsAt), selectedDay)) : []),
    [selectedDay, visibleEvents],
  );

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={goToday}
              className="focus-ring rounded-full border border-ink/15 px-4 py-1.5 text-sm text-ink/70 hover:border-ink/35"
            >
              Today
            </button>
            <button onClick={goPrev} className="focus-ring rounded-full p-2 text-ink/60 hover:bg-paper-dim" aria-label="Previous">
              ‹
            </button>
            <button onClick={goNext} className="focus-ring rounded-full p-2 text-ink/60 hover:bg-paper-dim" aria-label="Next">
              ›
            </button>
            <h2 className="ml-1 font-display text-xl">{label}</h2>
          </div>

          <div className="flex gap-1 rounded-full border border-ink/15 p-1">
            {(["day", "week", "month"] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`focus-ring rounded-full px-3.5 py-1.5 text-sm capitalize transition-colors ${
                  view === v ? "bg-ink text-white" : "text-ink/60 hover:text-ink"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {isPending && events.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink/40">Loading events…</p>
          ) : view === "month" ? (
            <MonthGrid anchor={anchor} events={visibleEvents} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
          ) : view === "week" ? (
            <TimeGrid
              days={Array.from({ length: 7 }, (_, i) => addDays(from, i))}
              events={visibleEvents}
              onDayHeaderClick={(day) => {
                setAnchor(day);
                setView("day");
              }}
            />
          ) : (
            <TimeGrid days={[anchor]} events={visibleEvents} />
          )}
        </div>

        <AnimatePresence>
          {selectedDay ? <DayAgenda day={selectedDay} events={selectedDayEvents} onClose={() => setSelectedDay(null)} /> : null}
        </AnimatePresence>
      </div>

      <aside className="w-full shrink-0 lg:w-72">
        <CategoryFilterPanel hidden={hidden} onToggle={toggleCategory} onShowAll={showAll} onHideAll={hideAll} />
      </aside>
    </div>
  );
}
