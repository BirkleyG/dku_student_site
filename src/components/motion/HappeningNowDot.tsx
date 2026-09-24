"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** True while `now` falls within [startsAt, endsAt). */
export function isHappeningNow(startsAt: string | Date, endsAt: string | Date, now: Date = new Date()) {
  const t = now.getTime();
  return t >= new Date(startsAt).getTime() && t < new Date(endsAt).getTime();
}

/**
 * A small pulsing dot marking an event that's currently in progress.
 * Computes "now" on mount and re-checks periodically rather than at render
 * time, so server and client agree on the first paint (no hydration
 * mismatch from a server-rendered "now"). Renders nothing when the event
 * isn't currently happening. transform/opacity only; the pulse ring is
 * skipped under prefers-reduced-motion, leaving a plain static dot.
 */
export function HappeningNowDot({
  startsAt,
  endsAt,
  className,
}: {
  startsAt: string | Date;
  endsAt: string | Date;
  className?: string;
}) {
  const [live, setLive] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const check = () => setLive(isHappeningNow(startsAt, endsAt));
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [startsAt, endsAt]);

  if (!live) return null;

  return (
    <span className={`relative inline-flex h-2 w-2 shrink-0 ${className ?? ""}`}>
      {!reducedMotion && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-danger"
          animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <span aria-hidden className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
      <span className="sr-only">Happening now</span>
    </span>
  );
}
