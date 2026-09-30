"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { FriendsModal } from "./FriendsModal";

const HEARTBEAT_MS = 60_000;
const SUMMARY_MS = 90_000;

/** Window event other parts of the app (the Home friend widgets) dispatch to open the Friends panel. */
export const OPEN_FRIENDS_EVENT = "dku:open-friends";

/**
 * Header button for the Friends panel. Also owns two background jobs for signed-in people: a presence heartbeat
 * (so friends can see you're online) and a light poll of the unseen-updates badge.
 */
export function FriendsButton() {
  const t = useT("friends");
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState({ unseen: 0, online: 0 });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/friends/summary");
      if (res.ok) setSummary(await res.json());
    } catch {
      // the badge just stays as it was
    }
  }, []);

  useEffect(() => {
    const beat = () => {
      if (document.visibilityState === "visible") void fetch("/api/presence", { method: "POST" }).catch(() => undefined);
    };
    beat();
    let cancelled = false;
    fetch("/api/friends/summary")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setSummary(data);
      })
      .catch(() => undefined);
    const heart = setInterval(beat, HEARTBEAT_MS);
    const poll = setInterval(() => void refresh(), SUMMARY_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      cancelled = true;
      clearInterval(heart);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [refresh]);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(OPEN_FRIENDS_EVENT, show);
    // Push notifications for new followers deep-link here as /home?friends=1.
    if (new URLSearchParams(window.location.search).get("friends") === "1") show();
    return () => window.removeEventListener(OPEN_FRIENDS_EVENT, show);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label={t("openFriends")}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="focus-ring relative grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-ink/70 transition-colors hover:border-ink/40 hover:text-ink"
      >
        <Users className="h-4 w-4" strokeWidth={1.75} />
        {summary.unseen > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-w-[1.1rem] place-items-center rounded-full bg-gold px-1 text-[10px] font-semibold leading-[1.1rem] text-ink ring-2 ring-paper">
            {summary.unseen > 9 ? "9+" : summary.unseen}
          </span>
        ) : summary.online > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-sprout-deep ring-2 ring-paper" aria-hidden />
        ) : null}
      </button>
      <AnimatePresence>
        {open ? (
          <FriendsModal
            onClose={() => {
              setOpen(false);
              void refresh();
            }}
            onSeen={() => void refresh()}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
