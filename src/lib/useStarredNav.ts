"use client";

import { useState, useSyncExternalStore } from "react";
import { MAX_STARRED_NAV } from "@/lib/nav";

const STORAGE_KEY = "dku-life:starred-nav";

function parseStored(raw: string | null): string[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((value) => typeof value === "string")) {
      return parsed;
    }
  } catch {
    // malformed storage — ignore and fall back to the server-provided default
  }
  return null;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot(): string | null {
  return null;
}

function writeLocalStorage(value: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // private browsing / storage disabled — starring still works for this session
  }
}

/**
 * Tracks the header's starred nav tabs. Logged-in users persist to the
 * nav-preferences API; guests persist to localStorage. Updates are optimistic.
 */
export function useStarredNav(initialStarred: string[], isLoggedIn: boolean) {
  // The server can't see localStorage, so guests are handed the same default
  // as everyone else on first paint; useSyncExternalStore (hydration-safe,
  // unlike reading localStorage in an effect) picks up their saved value as
  // soon as the client mounts.
  const storedRaw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const storedOverride = isLoggedIn ? null : parseStored(storedRaw);

  const [starred, setStarred] = useState<string[]>(initialStarred);

  // Once the guest's saved value shows up, adopt it. After that, every
  // toggle below writes to storage too, so this stays a no-op — it isn't a
  // loop, it's the "adjust state when a prop/external value changes" pattern.
  if (storedOverride && JSON.stringify(storedOverride) !== JSON.stringify(starred)) {
    setStarred(storedOverride);
  }

  const [limitHit, setLimitHit] = useState(false);

  function toggleStar(href: string) {
    setStarred((prev) => {
      const isStarred = prev.includes(href);
      if (!isStarred && prev.length >= MAX_STARRED_NAV) {
        setLimitHit(true);
        setTimeout(() => setLimitHit(false), 2200);
        return prev;
      }

      const next = isStarred ? prev.filter((h) => h !== href) : [...prev, href];

      if (isLoggedIn) {
        fetch("/api/user/nav-preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ starredNav: next }),
        }).catch(() => {
          // best-effort; the header already reflects the optimistic update
        });
      } else {
        writeLocalStorage(next);
      }

      return next;
    });
  }

  return { starred, toggleStar, limitHit };
}
