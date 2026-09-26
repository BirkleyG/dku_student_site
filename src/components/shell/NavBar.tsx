"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, HelpCircle } from "lucide-react";
import { navItems, adminNavItem } from "@/lib/nav";
import { useStarredNav } from "@/lib/useStarredNav";
import { useT } from "@/lib/i18n/client";
import { navMenuTourBridge } from "@/lib/tourBridge";
import { NavMenu } from "./NavMenu";
import { HelpMenu } from "@/components/onboarding/HelpMenu";

const SCROLL_THRESHOLD = 24;
// A swipe starting within this many px of the right screen edge, moving left
// past SWIPE_DISTANCE with limited vertical drift, opens the drawer — mirrors
// the drawer's own slide-in-from-the-right animation.
const EDGE_ZONE = 32;
const SWIPE_DISTANCE = 60;
const SWIPE_MAX_VERTICAL = 60;
// Matches Tailwind's `sm` breakpoint, which is what switches the header's
// starred row / bottom tab bar between desktop and mobile layout.
const MOBILE_MEDIA_QUERY = "(max-width: 639px)";

function useIsMobileViewport(): boolean {
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

type Props = {
  userLabel: string | null;
  isAdmin?: boolean;
  initialStarred: string[];
  initialStarredMobile: string[];
  communityScore?: number | null;
};

export function NavBar({ userLabel, isAdmin, initialStarred, initialStarredMobile, communityScore }: Props) {
  const t = useT("nav");
  const pathname = usePathname();
  const isLoggedIn = userLabel !== null;
  const items = isAdmin ? [...navItems, adminNavItem] : navItems;
  // Desktop (header row) and mobile (bottom tab bar) keep independent starred
  // lists — the mobile surface is much smaller, so it caps out lower.
  const desktopNav = useStarredNav(initialStarred, isLoggedIn, "desktop");
  const mobileNav = useStarredNav(initialStarredMobile, isLoggedIn, "mobile");
  // Chat and Eats own their full-height layout below the header; a fixed
  // bottom tab bar would sit on top of Chat's composer, so it's skipped there.
  const isFullBleedRoute = pathname === "/eats" || pathname === "/chat";

  // Tracks which list the drawer is editing: opened from the top hamburger
  // (desktop), the bottom tab bar's More button, or the right-edge swipe
  // (both touch-only, so mobile) — vs. the onboarding tour, which opens the
  // drawer itself with no button click to infer a device from, so it falls
  // back to the real viewport width. Without this, starring a tab mid-tour
  // on a phone silently wrote to the desktop list, which the phone never
  // shows — the tour's star step looked like it did nothing.
  const [menuDevice, setMenuDevice] = useState<"desktop" | "mobile" | null>(null);
  const tourWantsMenuOpen = navMenuTourBridge.useValue();
  const menuOpen = menuDevice !== null || tourWantsMenuOpen;
  const isMobileViewport = useIsMobileViewport();
  const activeDevice = menuDevice ?? (isMobileViewport ? "mobile" : "desktop");
  const activeNav = activeDevice === "mobile" ? mobileNav : desktopNav;
  const closeMenu = () => {
    setMenuDevice(null);
    navMenuTourBridge.set(false);
  };
  const [helpOpen, setHelpOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  // The header's backdrop-blur makes it a containing block for `position:
  // fixed` descendants, which would pin the bottom tab bar to the header's
  // own bottom edge instead of the viewport's — so it portals to <body>,
  // same fix NavMenu's drawer already uses for the same reason.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const starredItems = items.filter((item) => desktopNav.starred.includes(item.href));
  const mobileStarredItems = items.filter((item) => mobileNav.starred.includes(item.href));

  // Shrinks and frosts once the page has scrolled past a small threshold —
  // transform/opacity/backdrop-blur only, so it stays cheap. The ResizeObserver
  // below re-measures --header-h whenever this changes the header's height.
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > SCROLL_THRESHOLD);
  });

  // Expose the header's rendered height as --header-h so other components (e.g. the
  // full-screen Eats layout) can size themselves against it.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const setHeaderHeight = () => {
      document.documentElement.style.setProperty("--header-h", `${header.offsetHeight}px`);
    };
    setHeaderHeight();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(setHeaderHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  // Edge swipe: starting a touch near the right edge and dragging left opens
  // the drawer, same direction it slides in from.
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    function handleTouchStart(event: TouchEvent) {
      const touch = event.touches[0];
      if (!touch) return;
      tracking = window.innerWidth - touch.clientX <= EDGE_ZONE;
      startX = touch.clientX;
      startY = touch.clientY;
    }

    function handleTouchEnd(event: TouchEvent) {
      if (!tracking) return;
      tracking = false;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      if (deltaX <= -SWIPE_DISTANCE && Math.abs(deltaY) <= SWIPE_MAX_VERTICAL) {
        setMenuDevice("mobile");
      }
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <motion.header
      ref={headerRef}
      className="sticky top-0 z-30 border-b border-ink/10 pt-[env(safe-area-inset-top)] backdrop-blur-md"
      animate={{ backgroundColor: scrolled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.85)" }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 sm:px-6"
        animate={{ paddingTop: scrolled ? 10 : 16, paddingBottom: scrolled ? 10 : 16 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link
          href="/home"
          className="focus-ring flex shrink-0 items-center gap-2.5 font-display text-2xl tracking-tight text-ink"
        >
          <motion.span
            className="grid h-8 w-8 place-items-center rounded-full bg-ink text-[11px] font-semibold tracking-wide text-white"
            animate={{ scale: scrolled ? 0.85 : 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            DK
          </motion.span>
          <span className="hidden sm:inline">
            DKU <em className="italic text-gold-bright">Life</em>
          </span>
        </Link>

        <nav
          aria-label="Starred tabs"
          className="hidden flex-1 items-center justify-center gap-6 overflow-hidden sm:flex"
        >
          {starredItems.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={t(item.labelKey)}
                className={`link-sweep focus-ring shrink-0 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.18em] transition-colors ${
                  active ? "active text-ink" : "text-ink/55 hover:text-ink"
                }`}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {!isLoggedIn && (
            <Link
              href="/login"
              className="focus-ring rounded-full bg-ink px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white transition-transform hover:-translate-y-0.5 hover:bg-ink/85 sm:px-5"
            >
              {t("logIn")}
            </Link>
          )}
          <div className="relative">
            <button
              ref={helpButtonRef}
              type="button"
              data-tour="help-button"
              aria-expanded={helpOpen}
              aria-haspopup="menu"
              aria-label="Help and tour options"
              onClick={() => setHelpOpen((v) => !v)}
              className="focus-ring grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-ink/70 transition-colors hover:border-ink/40 hover:text-ink"
            >
              <HelpCircle className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <HelpMenu open={helpOpen} onClose={() => setHelpOpen(false)} triggerRef={helpButtonRef} />
          </div>
          <button
            ref={menuButtonRef}
            type="button"
            data-tour="nav-hamburger"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            aria-label={t("openMenu")}
            onClick={() => setMenuDevice("desktop")}
            className="focus-ring grid h-11 w-11 place-items-center rounded-full border border-ink/15 text-ink/70 transition-colors hover:border-ink/40 hover:text-ink"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </motion.div>

      {mounted &&
        !isFullBleedRoute &&
        createPortal(
          <nav
            aria-label={t("more")}
            className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-ink/10 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
          >
            {mobileStarredItems.map((item) => {
              const Icon = item.icon;
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors ${
                    active ? "text-ink" : "text-ink/50"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                  <span className="truncate">{t(item.labelKey)}</span>
                </Link>
              );
            })}
            <button
              ref={moreButtonRef}
              type="button"
              aria-expanded={menuDevice === "mobile"}
              aria-haspopup="dialog"
              aria-label={t("openMenu")}
              onClick={() => setMenuDevice("mobile")}
              className="flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium text-ink/50 transition-colors"
            >
              <Menu className="h-5 w-5 shrink-0" strokeWidth={1.75} />
              <span>{t("more")}</span>
            </button>
          </nav>,
          document.body,
        )}

      <NavMenu
        open={menuOpen}
        onClose={closeMenu}
        items={items}
        starred={activeNav.starred}
        onToggleStar={activeNav.toggleStar}
        limitHit={activeNav.limitHit}
        starLimit={activeNav.max}
        userLabel={userLabel}
        communityScore={communityScore}
        triggerRef={activeDevice === "mobile" ? moreButtonRef : menuButtonRef}
      />
    </motion.header>
  );
}
