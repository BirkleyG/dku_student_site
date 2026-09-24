"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

/** A checkmark that draws itself stroke-first (`pathLength`) when an RSVP
 * lands, rather than just popping in — transform/opacity-safe since only
 * `pathLength`, `opacity` and `scale` are animated. */
function CheckDraw() {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.path
        d="M5 12.5l4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      />
    </motion.svg>
  );
}

export function RsvpButton({
  eventId,
  initialGoing,
  initialCount,
  loggedIn,
}: {
  eventId: string;
  initialGoing: boolean;
  initialCount: number;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [going, setGoing] = useState(initialGoing);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  if (!loggedIn) {
    return (
      <Button variant="secondary" onClick={() => router.push("/login")}>
        Log in to RSVP
      </Button>
    );
  }

  const onClick = async () => {
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/rsvp`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setGoing(data.going);
      setCount((c) => c + (data.going ? 1 : -1));
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-3">
      <Button variant={going ? "secondary" : "primary"} onClick={onClick} disabled={loading}>
        <span className="inline-flex items-center gap-1.5">
          {going ? "You're going" : "RSVP"}
          <AnimatePresence mode="wait" initial={false}>
            {going && <CheckDraw key="check" />}
          </AnimatePresence>
        </span>
      </Button>
      <span className="text-sm text-ink/50">{count} going</span>
    </div>
  );
}
