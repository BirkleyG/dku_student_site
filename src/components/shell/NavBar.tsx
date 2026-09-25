"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, HelpCircle } from "lucide-react";
import { navItems, adminNavItem } from "@/lib/nav";
import { useStarredNav } from "@/lib/useStarredNav";
import { navMenuTourBridge } from "@/lib/tourBridge";
import { NavMenu } from "./NavMenu";
import { HelpMenu } from "@/components/onboarding/HelpMenu";

const SCROLL_THRESHOLD = 24;

type Props = {
  userLabel: string | null;
  isAdmin?: boolean;
  initialStarred: string[];
  communityScore?: number | null;
};

export function NavBar({ userLabel, isAdmin, initialStarred, communityScore }: Props) {
  const pathname = usePathname();
  const isLoggedIn = userLabel !== null;
  const items = isAdmin ? [...navItems, adminNavItem] : navItems;
  const { starred, toggleStar, limitHit } = useStarredNav(initialStarred, isLoggedIn);
  const [localMenuOpen, setLocalMenuOpen] = useState(false);
  const tourWantsMenuOpen = navMenuTourBridge.useValue();
  const menuOpen = localMenuOpen || tourWantsMenuOpen;
  const closeMenu = () => {
    setLocalMenuOpen(false);
    navMenuTourBridge.set(false);
  };
  const [helpOpen, setHelpOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const starredItems = items.filter((item) => starred.includes(item.href));

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

  return (
    <motion.header
      ref={headerRef}
      className="sticky top-0 z-30 border-b border-ink/10 backdrop-blur-md"
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

        <nav aria-label="Starred tabs" className="flex flex-1 items-center justify-center gap-2 overflow-hidden sm:gap-6">
          {starredItems.map((item) => {
            const Icon = item.icon;
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`link-sweep focus-ring flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.18em] transition-colors ${
                  active ? "active text-ink" : "text-ink/55 hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 sm:hidden" strokeWidth={2} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {!isLoggedIn && (
            <Link
              href="/login"
              className="focus-ring rounded-full bg-ink px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white transition-transform hover:-translate-y-0.5 hover:bg-ink/85 sm:px-5"
            >
              Log in
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
            aria-label="Open menu"
            onClick={() => setLocalMenuOpen(true)}
            className="focus-ring grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-ink/70 transition-colors hover:border-ink/40 hover:text-ink"
          >
            <Menu className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </motion.div>

      <NavMenu
        open={menuOpen}
        onClose={closeMenu}
        items={items}
        starred={starred}
        onToggleStar={toggleStar}
        limitHit={limitHit}
        userLabel={userLabel}
        communityScore={communityScore}
        triggerRef={menuButtonRef}
      />
    </motion.header>
  );
}
