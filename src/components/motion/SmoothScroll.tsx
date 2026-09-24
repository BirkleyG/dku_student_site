"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// DKU Eats renders a full-bleed iframe and needs native scroll to size
// itself against --header-h — Lenis must never intercept that route.
const FULL_BLEED_ROUTES = ["/eats"];

/**
 * The Lenis instance lives at the root and persists across client-side
 * route changes (Next.js swaps page content in place, it doesn't remount
 * this provider) — but Lenis caches a `limit` (max scroll = content height
 * - viewport height) that it only recalculates on its own resize
 * observers. Navigating to a page with very different content height can
 * leave that cached limit stale, which reads as scroll silently refusing
 * to go past some arbitrary point on the new page. Force a resize on every
 * route change so Lenis always re-measures the new page's real height.
 *
 * Since Lenis owns scroll position (not the browser), Next's own scroll
 * restoration doesn't reach it — a client-side navigation would otherwise
 * land wherever Lenis's virtual position already was, not the top of the
 * new page. Snap to 0 immediately on every route change, before the
 * resize, so a subpage always opens scrolled to its top.
 */
function LenisRouteResize() {
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true });
    const raf = requestAnimationFrame(() => lenis?.resize());
    return () => cancelAnimationFrame(raf);
  }, [pathname, lenis]);

  return null;
}

/** Reduced-motion / full-bleed fallback: no Lenis instance exists, so the
 * page relies on native scroll — reset it the same way on every route change. */
function ScrollToTopOnRouteChange() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

/**
 * The login modal (LoginModal.tsx) and the ☰ drawer (NavMenu.tsx) both lock
 * native scroll by setting `document.body.style.overflow = "hidden"` while
 * they're open. Lenis owns scroll independently of the browser, so it needs
 * to be told to stop too — watch that same signal rather than coupling to
 * either component directly.
 */
function LenisBodyLockWatcher() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const sync = () => {
      if (document.body.style.overflow === "hidden") {
        lenis.stop();
      } else {
        lenis.start();
      }
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, [lenis]);

  return null;
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  const disabled = reducedMotion || FULL_BLEED_ROUTES.includes(pathname ?? "");

  if (disabled) {
    return (
      <>
        <ScrollToTopOnRouteChange />
        {children}
      </>
    );
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2 }}>
      <LenisRouteResize />
      <LenisBodyLockWatcher />
      {children}
    </ReactLenis>
  );
}
