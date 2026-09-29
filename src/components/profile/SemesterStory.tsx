"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ReviewSlide, ReviewTone, SemesterReviewData } from "@/lib/semester-review";

const TONES: Record<ReviewTone, string> = {
  green: "from-[#0d2b20] to-[#2f7d57]",
  gold: "from-[#5b4a1f] to-[#b9a46b]",
  blue: "from-[#12305c] to-[#3b7dd8]",
  rose: "from-[#5c1a33] to-[#d1557f]",
  violet: "from-[#33205c] to-[#8a5fd6]",
  orange: "from-[#6b2c0d] to-[#e0803a]",
};

type Frame =
  | { kind: "intro" }
  | { kind: "slide"; slide: ReviewSlide }
  | { kind: "outro" };

/** Full-screen, tap / swipe / keyboard driven story. Purely presentational: no network, no writes. */
export function SemesterStory({ review, onClose }: { review: SemesterReviewData; onClose: () => void }) {
  const reduce = useReducedMotion();
  const frames: Frame[] = [
    { kind: "intro" },
    ...review.slides.map((slide) => ({ kind: "slide" as const, slide })),
    { kind: "outro" },
  ];
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const touchX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const last = frames.length - 1;

  const go = useCallback(
    (delta: number) => {
      setDir(delta);
      setIndex((i) => Math.min(last, Math.max(0, i + delta)));
    },
    [last],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === " ") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, go]);

  const frame = frames[index];
  const tone: ReviewTone = frame.kind === "slide" ? frame.slide.tone : "green";

  const variants = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * 60 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * -60 }),
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${review.semester.label} in review`}
      className={`fixed inset-0 z-[100] flex select-none flex-col bg-gradient-to-br ${TONES[tone]} text-white transition-colors duration-500`}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex gap-1 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        {frames.map((_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
            <div className={`h-full bg-white ${reduce ? "" : "transition-[width] duration-300"}`} style={{ width: i <= index ? "100%" : "0%" }} />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">{review.semester.label}</p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/15 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tap zones: left third goes back, the rest goes forward. */}
      <div className="relative flex-1 overflow-hidden">
        <button type="button" aria-label="Previous card" onClick={() => go(-1)} className="absolute inset-y-0 left-0 z-10 w-1/3 cursor-w-resize" />
        <button type="button" aria-label="Next card" onClick={() => (index === last ? onClose() : go(1))} className="absolute inset-y-0 right-0 z-10 w-2/3 cursor-e-resize" />
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={index}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduce ? 0.15 : 0.35, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
            aria-live="polite"
          >
            <FrameBody frame={frame} label={review.semester.label} reduce={!!reduce} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="hidden items-center justify-center gap-4 pb-6 sm:flex">
        <button type="button" aria-label="Previous" disabled={index === 0} onClick={() => go(-1)} className="grid h-10 w-10 place-items-center rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-30">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Next" disabled={index === last} onClick={() => go(1)} className="grid h-10 w-10 place-items-center rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-30">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <p className="pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-white/50 sm:hidden">Tap or swipe to continue</p>
    </div>
  );
}

function FrameBody({ frame, label, reduce }: { frame: Frame; label: string; reduce: boolean }) {
  const pop = (delay: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 16, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { delay, duration: 0.5, ease: "easeOut" as const } };

  if (frame.kind === "intro") {
    return (
      <>
        <motion.p {...pop(0.05)} className="text-sm uppercase tracking-[0.3em] text-white/70">Your</motion.p>
        <motion.h2 {...pop(0.15)} className="mt-3 font-display text-5xl leading-tight">Semester in Review</motion.h2>
        <motion.p {...pop(0.3)} className="mt-4 text-lg text-white/80">{label}</motion.p>
      </>
    );
  }
  if (frame.kind === "outro") {
    return (
      <>
        <motion.h2 {...pop(0.05)} className="font-display text-4xl leading-tight">That&apos;s your semester!</motion.h2>
        <motion.p {...pop(0.2)} className="mt-4 max-w-xs text-white/80">Thanks for being part of DKU Life. See you next semester.</motion.p>
      </>
    );
  }
  const { slide } = frame;
  return (
    <>
      <motion.p {...pop(0.05)} className="text-lg text-white/80">{slide.title}</motion.p>
      <motion.p {...pop(0.2)} className="mt-3 font-display text-6xl leading-none sm:text-7xl">{slide.big}</motion.p>
      <motion.p {...pop(0.35)} className="mt-5 max-w-sm text-white/85">{slide.caption}</motion.p>
      {slide.details && slide.details.length > 0 ? (
        <motion.ul {...pop(0.5)} className="mt-6 w-full max-w-xs space-y-2 text-left text-sm">
          {slide.details.map((d) => (
            <li key={d.label} className="flex items-center justify-between rounded-xl bg-white/15 px-4 py-2.5">
              <span className="text-white/85">{d.label}</span>
              <span className="font-semibold">{d.value}</span>
            </li>
          ))}
        </motion.ul>
      ) : null}
    </>
  );
}
