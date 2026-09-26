"use client";

import { useEffect, useState, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnboardingTour } from "./OnboardingProvider";
import { FaqModal } from "./FaqModal";

export function HelpMenu({
  open,
  onClose,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const { replay } = useOnboardingTour();
  const [faqOpen, setFaqOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose, triggerRef]);

  const retakeTour = () => {
    onClose();
    replay();
  };

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-40 w-56 rounded-2xl border border-ink/10 bg-white p-1.5 shadow-xl"
          >
            <button
              role="menuitem"
              onClick={retakeTour}
              className="focus-ring w-full rounded-xl px-3 py-2.5 text-left text-sm text-ink hover:bg-paper-dim"
            >
              Take the tour again
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setFaqOpen(true);
                onClose();
              }}
              className="focus-ring w-full rounded-xl px-3 py-2.5 text-left text-sm text-ink hover:bg-paper-dim"
            >
              Common questions
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {faqOpen ? <FaqModal onClose={() => setFaqOpen(false)} /> : null}
    </>
  );
}
