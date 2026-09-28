"use client";

import { useSyncExternalStore } from "react";

// Matches Tailwind's `sm` breakpoint, the same cutoff the mobile-only layout
// classes (`sm:hidden` / `sm:flex` / `sm:static`, etc.) switch on.
const MOBILE_MEDIA_QUERY = "(max-width: 639px)";

/** True below the `sm` breakpoint. SSR-safe: reports false on the server/first paint. */
export function useIsMobileViewport(): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    () => window.matchMedia(MOBILE_MEDIA_QUERY).matches,
    () => false,
  );
}
