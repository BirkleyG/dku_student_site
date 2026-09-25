"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { EVENT_CATEGORY_MAP } from "@/lib/event-categories";
import { HappeningNowDot } from "@/components/motion/HappeningNowDot";
import { useT } from "@/lib/i18n/client";
import type { ApiEvent } from "./calendar-types";

type Props = {
  day: Date;
  events: ApiEvent[];
  onClose: () => void;
};

export function DayAgenda({ day, events, onClose }: Props) {
  const t = useT("events");
  return (
    <motion.div
      id="day-agenda"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="mt-6 overflow-hidden rounded-3xl border border-ink/10 bg-paper"
    >
      <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
        <h3 className="font-display text-xl">{format(day, "EEEE, MMMM d")}</h3>
        <button onClick={onClose} className="focus-ring text-sm text-ink/50 hover:text-ink">
          {t("close")}
        </button>
      </div>

      <div className="space-y-1 p-3">
        {events.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-ink/40">{t("nothingThisDay")}</p>
        ) : (
          events.map((event) => {
            const meta = EVENT_CATEGORY_MAP[event.category];
            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="focus-ring flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-paper-dim"
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
                <span className="w-20 shrink-0 text-xs text-ink/45">{format(new Date(event.startsAt), "h:mm a")}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 truncate text-sm text-ink">
                    <HappeningNowDot startsAt={event.startsAt} endsAt={event.endsAt} />
                    <span className="truncate">{event.title}</span>
                  </span>
                  <span className="block truncate text-xs text-ink/45">{event.location}</span>
                </span>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                  style={{ backgroundColor: meta.tint, color: meta.color }}
                >
                  {meta.label}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
