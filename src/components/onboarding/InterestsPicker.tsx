"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import type { NavItem } from "@/lib/nav";

export function InterestsPicker({
  items,
  onContinue,
}: {
  items: NavItem[];
  onContinue: (selected: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(items.map((i) => i.href)));
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const toggle = (href: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  };

  if (!mounted) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-[75] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" aria-hidden />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <p className="font-display text-xl text-ink">What are you interested in?</p>
        <p className="mt-1.5 text-sm text-ink/60">
          I&apos;ll tailor the tour to these — everything&apos;s checked by default.
        </p>

        <div className="mt-5 grid max-h-[45vh] grid-cols-2 gap-2 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const checked = selected.has(item.href);
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => toggle(item.href)}
                aria-pressed={checked}
                className={`focus-ring flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                  checked ? "border-gold bg-gold/10 text-ink" : "border-ink/12 text-ink/50 hover:border-ink/25"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onContinue(items.filter((i) => selected.has(i.href)).map((i) => i.href))}
          disabled={selected.size === 0}
          className="focus-ring mt-6 w-full rounded-full bg-gold px-5 py-3 text-sm font-medium text-ink transition-transform hover:-translate-y-0.5 hover:bg-gold-bright disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </motion.div>,
    document.body,
  );
}
