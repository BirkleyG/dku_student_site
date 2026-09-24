"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { appCatalog, appOrder, sizeOrder, sizeSpec, type WidgetApp, type WidgetSize } from "@/lib/widgets";
import { AppWidgetContent, type WidgetData } from "./AppWidgetContent";

export function WidgetGallery({
  data,
  onAdd,
  onClose,
}: {
  data: WidgetData;
  onAdd: (app: WidgetApp, size: WidgetSize) => void;
  onClose: () => void;
}) {
  const [activeApp, setActiveApp] = useState<WidgetApp>(appOrder[0]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl border border-ink/10 bg-paper sm:max-w-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="font-display text-2xl">Add a widget</h2>
          <button onClick={onClose} className="focus-ring rounded-full p-1.5 text-ink/50 hover:text-ink" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="flex w-28 shrink-0 flex-col gap-1 overflow-y-auto border-r border-ink/10 p-2 sm:w-40">
            {appOrder.map((app) => {
              const meta = appCatalog[app];
              const Icon = meta.icon;
              const active = app === activeApp;
              return (
                <button
                  key={app}
                  onClick={() => setActiveApp(app)}
                  className={`focus-ring flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-medium transition-colors sm:text-sm ${
                    active ? "bg-gold/15 text-ink" : "text-ink/55 hover:bg-paper-dim"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{meta.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <p className="text-sm text-ink/55">{appCatalog[activeApp].blurb}</p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {sizeOrder.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    onAdd(activeApp, size);
                    onClose();
                  }}
                  className="focus-ring group text-left"
                >
                  <div
                    className={`grid overflow-hidden rounded-2xl border border-ink/10 bg-paper p-3 text-[13px] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-gold ${
                      size === "SMALL" ? "aspect-square max-w-[9rem]" : size === "MEDIUM" ? "aspect-[2/1] max-w-[13rem]" : "aspect-square max-w-[13rem]"
                    }`}
                  >
                    <div className="min-w-0 overflow-hidden">
                      <AppWidgetContent app={activeApp} size={size} data={data} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-ink/50">
                      {sizeSpec[size].label}
                    </span>
                    <Plus className="h-3.5 w-3.5 text-ink/40 transition-colors group-hover:text-gold" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function GalleryPortal({ children }: { children: React.ReactNode }) {
  return <AnimatePresence>{children}</AnimatePresence>;
}
