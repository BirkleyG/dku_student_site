"use client";

import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { X, Star, Download, LogOut, Award, Bell } from "lucide-react";
import type { NavItem } from "@/lib/nav";
import { APP_VERSION } from "@/lib/version";
import { useT } from "@/lib/i18n/client";
import { LanguageToggle } from "./LanguageToggle";

type Props = {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  starred: string[];
  onToggleStar: (href: string) => void;
  limitHit: boolean;
  starLimit: number;
  userLabel: string | null;
  communityScore?: number | null;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
// Swiping the open drawer right past this offset (or fast enough) closes it,
// the reverse of the edge swipe that opens it.
const CLOSE_SWIPE_OFFSET = 80;
const CLOSE_SWIPE_VELOCITY = 600;

export function NavMenu({
  open,
  onClose,
  items,
  starred,
  onToggleStar,
  limitHit,
  starLimit,
  userLabel,
  communityScore,
  triggerRef,
}: Props) {
  const t = useT("nav");
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousPathname = useRef(pathname);
  const wasOpen = useRef(open);

  // Close on route change.
  useEffect(() => {
    if (open && pathname !== previousPathname.current) {
      onClose();
    }
    previousPathname.current = pathname;
  }, [pathname, open, onClose]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Focus the first focusable element, trap Tab inside the drawer, and close on Esc.
  useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    if (!drawer) return;

    const getFocusable = () => Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    getFocusable()[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Return focus to the ☰ button once the drawer closes.
  useEffect(() => {
    if (wasOpen.current && !open) {
      triggerRef.current?.focus();
    }
    wasOpen.current = open;
  }, [open, triggerRef]);

  // Render into <body>: the sticky header uses backdrop-filter, which makes it
  // the containing block for `position: fixed` children, so a drawer rendered
  // inside it gets clipped to the header's height.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="nav-menu-backdrop"
            aria-hidden
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="nav-menu-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("navigationMenu")}
            className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col border-l border-ink/10 bg-paper pt-[env(safe-area-inset-top)] shadow-xl sm:w-[360px]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.6 }}
            dragSnapToOrigin
            onDragEnd={(_, info) => {
              if (info.offset.x > CLOSE_SWIPE_OFFSET || info.velocity.x > CLOSE_SWIPE_VELOCITY) {
                onClose();
              }
            }}
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <span className="font-display text-xl">{t("menu")}</span>
              <div className="flex items-center gap-2">
                <LanguageToggle />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t("closeMenu")}
                  className="focus-ring grid h-11 w-11 place-items-center rounded-full text-ink/50 hover:text-ink"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {userLabel && (
              <Link
                href="/profile"
                onClick={onClose}
                className="focus-ring flex items-center justify-between gap-2 border-b border-ink/10 px-5 py-3 text-sm font-medium text-ink/70 transition-colors hover:text-ink"
              >
                {userLabel}
                {typeof communityScore === "number" ? (
                  <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-medium text-gold-bright">
                    <Award className="h-3 w-3" /> {communityScore}
                  </span>
                ) : null}
              </Link>
            )}

            <p className="px-5 pt-4 text-xs text-ink/45">{t("starHint")}</p>
            <nav aria-label={t("allTabs")} data-tour="nav-menu-list" className="flex-1 overflow-y-auto p-2">
              {items.map((item) => {
                const Icon = item.icon;
                const isStarred = starred.includes(item.href);
                const label = t(item.labelKey);
                return (
                  <div key={item.href} data-tour={`nav-item-${item.href}`} className="flex items-center gap-1">
                    <Link
                      href={item.href}
                      className="focus-ring flex flex-1 items-center gap-3 rounded-xl px-3 py-3 text-sm text-ink/80 transition-colors hover:bg-paper-dim"
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                      {label}
                    </Link>
                    <button
                      type="button"
                      onClick={() => onToggleStar(item.href)}
                      aria-pressed={isStarred}
                      aria-label={isStarred ? t("unstar", { label }) : t("star", { label })}
                      className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink/35 transition-colors hover:text-gold-bright"
                    >
                      <motion.span
                        key={isStarred ? "starred" : "unstarred"}
                        className="block"
                        initial={{ scale: 0.55 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 14 }}
                      >
                        <Star
                          className={`h-4 w-4 ${isStarred ? "fill-gold-bright text-gold-bright" : ""}`}
                          strokeWidth={1.75}
                        />
                      </motion.span>
                    </button>
                  </div>
                );
              })}
            </nav>

            <AnimatePresence>
              {limitHit && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden px-5 text-xs text-danger"
                >
                  {t("starLimit", { n: starLimit })}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="border-t border-ink/10 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
              {userLabel && (
                <Link
                  href="/settings"
                  onClick={onClose}
                  className="focus-ring flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-ink/80 transition-colors hover:bg-paper-dim"
                >
                  <Bell className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {t("notificationSettings")}
                </Link>
              )}
              <Link
                href="/install"
                className="focus-ring flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-ink/80 transition-colors hover:bg-paper-dim"
              >
                <Download className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                {t("getTheApp")}
              </Link>
              {userLabel && (
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-ink/80 transition-colors hover:bg-paper-dim"
                >
                  <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {t("logOut")}
                </button>
              )}
              <p className="px-3 pt-2 text-[10px] tabular-nums text-ink/30">v{APP_VERSION}</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
