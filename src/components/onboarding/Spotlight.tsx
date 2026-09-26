"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;

function measure(selector: string): Rect | null {
  const el = document.querySelector<HTMLElement>(`[data-tour="${selector}"]`);
  if (!el) return null;
  // offsetParent is null when the element (or an ancestor) is `display:
  // none` — e.g. Chat's channel sidebar is `hidden sm:flex`, invisible below
  // the sm breakpoint. Treat that the same as "not found" rather than
  // spotlighting an empty 0×0 box on mobile.
  if (el.offsetParent === null) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

const TOOLTIP_MARGIN = 14;
const TOOLTIP_EDGE_GAP = 16;
// We don't know the tooltip's real height until it renders (text length
// varies), so estimate generously — better to pick a side with room to
// spare than to compute a "fits" answer that's wrong by a few pixels and
// ends up overlapping the highlighted element anyway.
const TOOLTIP_HEIGHT_ESTIMATE = 220;

/**
 * Picks a side (below/right/left/above) for the tooltip that has enough
 * room and never overlaps the highlighted rect — critical for large targets
 * (e.g. the whole nav drawer) where "always place below" can land the
 * tooltip back inside the target itself.
 */
function placeTooltip(rect: Rect, tooltipWidth: number, viewportW: number, viewportH: number) {
  const th = TOOLTIP_HEIGHT_ESTIMATE;
  const clampTop = (top: number) => Math.min(Math.max(top, TOOLTIP_EDGE_GAP), Math.max(viewportH - th - TOOLTIP_EDGE_GAP, TOOLTIP_EDGE_GAP));
  const clampLeft = (left: number) =>
    Math.min(Math.max(left, TOOLTIP_EDGE_GAP), Math.max(viewportW - tooltipWidth - TOOLTIP_EDGE_GAP, TOOLTIP_EDGE_GAP));

  const spaceBelow = viewportH - (rect.top + rect.height);
  const spaceAbove = rect.top;
  const spaceRight = viewportW - (rect.left + rect.width);
  const spaceLeft = rect.left;

  if (spaceBelow >= th + TOOLTIP_MARGIN) {
    return { top: rect.top + rect.height + TOOLTIP_MARGIN, left: clampLeft(rect.left) };
  }
  if (spaceRight >= tooltipWidth + TOOLTIP_MARGIN) {
    return { top: clampTop(rect.top), left: rect.left + rect.width + TOOLTIP_MARGIN };
  }
  if (spaceLeft >= tooltipWidth + TOOLTIP_MARGIN) {
    return { top: clampTop(rect.top), left: rect.left - TOOLTIP_MARGIN - tooltipWidth };
  }
  if (spaceAbove >= th + TOOLTIP_MARGIN) {
    return { top: rect.top - TOOLTIP_MARGIN - th, left: clampLeft(rect.left) };
  }

  // Nothing fits cleanly (tiny viewport, huge target) — fall back to
  // whichever side has the most room, best-effort clamped.
  const best = Math.max(spaceBelow, spaceRight, spaceLeft, spaceAbove);
  if (best === spaceRight) return { top: clampTop(rect.top), left: viewportW - tooltipWidth - TOOLTIP_EDGE_GAP };
  if (best === spaceLeft) return { top: clampTop(rect.top), left: TOOLTIP_EDGE_GAP };
  if (best === spaceAbove) return { top: TOOLTIP_EDGE_GAP, left: clampLeft(rect.left) };
  return { top: viewportH - th - TOOLTIP_EDGE_GAP, left: clampLeft(rect.left) };
}

/**
 * A dimmed backdrop with a cut-out around the DOM node tagged
 * `data-tour="<target>"`, plus a tooltip card describing it. Re-measures on
 * resize/scroll so the cut-out tracks the real element (e.g. inside the nav
 * drawer, which itself scrolls).
 */
type Action = { label: string; onClick: () => void; primary?: boolean };

export function Spotlight({
  target,
  title,
  body,
  onNext,
  onBack,
  onSkip,
  onUnavailable,
  nextLabel = "Next",
  backLabel,
  skipLabel = "Skip tour",
  actions,
}: {
  target: string;
  title: string;
  body: string;
  onNext?: () => void;
  onBack?: () => void;
  onSkip: () => void;
  /**
   * Called once, instead of showing a broken empty spotlight, if `target`
   * still isn't a visible element after the retry window — e.g. a step
   * written for a desktop-only element (Chat's channel sidebar is hidden
   * below the sm breakpoint) reached on a mobile viewport. Callers should
   * treat this like the visitor pressed Next/skip past this step.
   */
  onUnavailable?: () => void;
  nextLabel?: string;
  backLabel?: string;
  skipLabel?: string;
  /** When set, replaces the default Back/Next buttons with these instead. */
  actions?: Action[];
}) {
  const [rect, setRect] = useState<Rect | null>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Kept in a ref so the retry effect below doesn't need onUnavailable in its
  // dependency array — callers pass a fresh arrow function every render.
  const onUnavailableRef = useRef(onUnavailable);
  useEffect(() => {
    onUnavailableRef.current = onUnavailable;
  });

  useLayoutEffect(() => {
    // Clear the stale rect immediately when the target changes, so the old
    // highlight/tooltip never lingers pointing at the wrong element while
    // the new one is (re-)measured.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRect(null);
    let frame = 0;
    let found: Rect | null = null;
    const started = Date.now();
    const update = () => {
      found = measure(target);
      setRect(found);
    };
    // The target may still be animating in (drawer slide, layout shift), or
    // — after a tour deep-dive navigation — the whole page may still be
    // fetching its data, so keep re-measuring for a few seconds rather than
    // a fixed number of frames.
    const tick = () => {
      update();
      if (Date.now() - started < 4000) {
        frame = requestAnimationFrame(tick);
      } else if (!found) {
        onUnavailableRef.current?.();
      }
    };
    frame = requestAnimationFrame(tick);

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [target]);

  if (!mounted) return null;

  const viewportW = typeof window !== "undefined" ? window.innerWidth : 0;
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 0;
  const tooltipWidth = Math.min(360, viewportW - 32);
  const tooltipPos = rect ? placeTooltip(rect, tooltipWidth, viewportW, viewportH) : null;

  return createPortal(
    // pointer-events-none on the wrapper lets clicks fall through to the
    // real page underneath — several tour steps (e.g. "tap the star next to
    // a tab") depend on the visitor actually being able to click the
    // highlighted element, not just the tooltip's own buttons. The tooltip
    // opts back in with pointer-events-auto below.
    <div className="pointer-events-none fixed inset-0 z-[70]" aria-live="polite">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect ? (
              <rect x={rect.left} y={rect.top} width={rect.width} height={rect.height} rx={14} fill="black" />
            ) : null}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(10,15,13,0.62)" mask="url(#spotlight-mask)" />
      </svg>

      {rect ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-none absolute rounded-2xl ring-2 ring-gold"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        />
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div
          key={target}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto absolute rounded-2xl bg-white p-5 shadow-2xl"
          style={
            tooltipPos
              ? { top: tooltipPos.top, left: tooltipPos.left, width: tooltipWidth }
              : { top: "50%", left: "50%", width: tooltipWidth, transform: "translate(-50%, -50%)" }
          }
        >
          <p className="font-display text-lg text-ink">{title}</p>
          <p className="mt-1.5 text-sm text-ink/70">{body}</p>
          <div className="mt-4 flex items-center justify-between gap-2">
            <button onClick={onSkip} className="focus-ring text-xs font-medium text-ink/40 hover:text-ink/70">
              {skipLabel}
            </button>
            <div className="flex gap-2">
              {actions
                ? actions.map((action) => (
                    <button
                      key={action.label}
                      onClick={action.onClick}
                      className={`focus-ring whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium ${
                        action.primary
                          ? "bg-gold text-ink hover:bg-gold-bright"
                          : "border border-ink/15 text-ink hover:bg-paper-dim"
                      }`}
                    >
                      {action.label}
                    </button>
                  ))
                : (
                    <>
                      {onBack ? (
                        <button
                          onClick={onBack}
                          className="focus-ring rounded-full border border-ink/15 px-4 py-2 text-xs font-medium text-ink hover:bg-paper-dim"
                        >
                          {backLabel ?? "Back"}
                        </button>
                      ) : null}
                      <button
                        onClick={onNext}
                        className="focus-ring rounded-full bg-gold px-4 py-2 text-xs font-medium text-ink hover:bg-gold-bright"
                      >
                        {nextLabel}
                      </button>
                    </>
                  )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body,
  );
}
