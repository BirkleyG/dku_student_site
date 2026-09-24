"use client";

import { useRef, useState, useSyncExternalStore } from "react";
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

  // Saves go out one at a time and only the newest value is sent next, so a
  // slow earlier request can never land after (and overwrite) a later one.
  const saving = useRef(false);
  const queued = useRef<string[] | null>(null);

  async function save(value: string[]) {
    queued.current = value;
    if (saving.current) return;
    saving.current = true;
    while (queued.current) {
      const next = queued.current;
      queued.current = null;
      try {
        await fetch("/api/user/nav-preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ starredNav: next }),
        });
      } catch {
        // best-effort; the header already reflects the optimistic update
      }
    }
    saving.current = false;
  }

  function toggleStar(href: string) {
    const isStarred = starred.includes(href);
    if (!isStarred && starred.length >= MAX_STARRED_NAV) {
      setLimitHit(true);
      setTimeout(() => setLimitHit(false), 2200);
      return;
    }

    const next = isStarred ? starred.filter((h) => h !== href) : [...starred, href];
    setStarred(next);
    if (isLoggedIn) save(next);
    else writeLocalStorage(next);
  }

  return { starred, toggleStar, limitHit };
}
