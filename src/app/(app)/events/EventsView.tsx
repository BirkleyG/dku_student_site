"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { addDays, addMonths, format, isSameDay, startOfDay, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from "date-fns";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";

type ApiEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  posterUrl: string | null;
  startsAt: string;
  endsAt: string;
  host: { firstName: string; lastName: string };
  _count: { rsvps: number };
};

type Range = "day" | "week" | "month";

const rangeLabels: Record<Range, string> = { day: "Day", week: "Week", month: "Month" };

export function EventsView() {
  const [range, setRange] = useState<Range>("week");
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const { from, to } = useMemo(() => {
    const now = new Date();
    if (range === "day") return { from: startOfDay(now), to: addDays(startOfDay(now), 1) };
    if (range === "week") return { from: startOfWeek(now), to: endOfWeek(now) };
    return { from: startOfMonth(now), to: endOfMonth(addMonths(now, 0)) };
  }, [range]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });
    fetch(`/api/events?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setEvents(data.events ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const grouped = useMemo(() => {
    const groups: { day: Date; items: ApiEvent[] }[] = [];
    for (const event of events) {
      const day = startOfDay(new Date(event.startsAt));
      const group = groups.find((g) => isSameDay(g.day, day));
      if (group) group.items.push(event);
      else groups.push({ day, items: [event] });
    }
    return groups.sort((a, b) => a.day.getTime() - b.day.getTime());
  }, [events]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(rangeLabels) as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`focus-ring rounded-full border px-4 py-1.5 text-sm transition-colors ${
              range === r ? "border-gold bg-gold/10 text-gold" : "border-paper/15 text-paper/50 hover:border-paper/35"
            }`}
          >
            {rangeLabels[r]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-paper/40">Loading events…</p>
      ) : grouped.length === 0 ? (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-10 text-paper/50">
          Nothing on the calendar for this {range}. Be the first to host something.
        </motion.p>
      ) : (
        <div className="mt-8 space-y-10">
          {grouped.map((group) => (
            <div key={group.day.toISOString()}>
              <h2 className="mb-3 font-display text-lg text-paper/70">{format(group.day, "EEEE, MMMM d")}</h2>
              <StaggerGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((event) => (
                  <StaggerItem key={event.id}>
                    <EventCard event={event} />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: ApiEvent }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="focus-ring group block overflow-hidden rounded-3xl border border-paper/10 bg-surface/70 transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="relative h-36 w-full overflow-hidden bg-surface-raised">
        {event.posterUrl ? (
          <Image
            src={event.posterUrl}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-3xl text-paper/15">DKU</div>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs uppercase tracking-wide text-gold">{format(new Date(event.startsAt), "h:mm a")}</p>
        <h3 className="mt-1 font-display text-lg">{event.title}</h3>
        <p className="mt-1 text-sm text-paper/50">{event.location}</p>
        <p className="mt-3 text-xs text-paper/40">
          Hosted by {event.host.firstName} · {event._count.rsvps} going
        </p>
      </div>
    </Link>
  );
}
