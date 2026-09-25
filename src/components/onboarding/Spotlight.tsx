"use client";

import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;

function measure(selector: string): Rect | null {
  const el = document.querySelector<HTMLElement>(`[data-tour="${selector}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
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

  useLayoutEffect(() => {
    let frame = 0;
    const update = () => setRect(measure(target));
    update();
    // The target may still be animating in (drawer slide, layout shift) —
    // keep re-measuring for a bit rather than a single stale read.
    let ticks = 0;
    const tick = () => {
      update();
      ticks += 1;
      if (ticks < 20) frame = requestAnimationFrame(tick);
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
  const tooltipBelow = rect ? rect.top + rect.height < viewportH * 0.6 : true;

  return createPortal(
    <div className="fixed inset-0 z-[70]" aria-live="polite">
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
          className="pointer-events-auto absolute w-[min(360px,calc(100vw-32px))] rounded-2xl bg-white p-5 shadow-2xl"
          style={
            rect
              ? tooltipBelow
                ? { top: Math.min(rect.top + rect.height + 14, viewportH - 220), left: Math.min(Math.max(rect.left, 16), viewportW - 376) }
                : { top: Math.max(rect.top - 14, 16), left: Math.min(Math.max(rect.left, 16), viewportW - 376), transform: "translateY(-100%)" }
              : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
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
