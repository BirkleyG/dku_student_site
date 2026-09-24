"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { widgetCatalog, widgetGroups, defaultConfigFor, type WidgetKind } from "@/lib/widgets";
import { AppWidgetContent, type WidgetData } from "./AppWidgetContent";

export function WidgetGallery({
  data,
  onAdd,
  onClose,
}: {
  data: WidgetData;
  onAdd: (kind: WidgetKind, config?: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [activeGroup, setActiveGroup] = useState(widgetGroups[0].key);
  const group = widgetGroups.find((g) => g.key === activeGroup) ?? widgetGroups[0];

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
            {widgetGroups.map((g) => {
              const Icon = g.icon;
              const active = g.key === activeGroup;
              return (
                <button
                  key={g.key}
                  onClick={() => setActiveGroup(g.key)}
                  className={`focus-ring flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-medium transition-colors sm:text-sm ${
                    active ? "bg-gold/15 text-ink" : "text-ink/55 hover:bg-paper-dim"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{g.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {group.kinds.map((kind) => {
                const meta = widgetCatalog[kind];
                const previewConfig = kind === "EATS_FAVORITE" ? defaultConfigFor(kind) : {};
                return (
                  <button
                    key={kind}
                    onClick={() => {
                      onAdd(kind, defaultConfigFor(kind));
                      onClose();
                    }}
                    className="focus-ring group text-left"
                  >
                    <div
                      className={`overflow-hidden rounded-2xl border border-ink/10 bg-paper p-3 text-[13px] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-gold ${
                        meta.size === "SMALL"
                          ? "aspect-square max-w-[10rem]"
                          : meta.size === "MEDIUM"
                            ? "aspect-[2/1] max-w-[16rem]"
                            : "aspect-square max-w-[16rem]"
                      }`}
                    >
                      <div className="min-w-0 overflow-hidden">
                        <AppWidgetContent instance={{ id: `preview-${kind}`, kind, config: previewConfig }} data={data} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="flex items-center gap-1.5 text-xs font-medium text-ink">
                        {meta.label}
                        {meta.eatsData && !data.eats.live ? (
                          <span className="rounded-full bg-ink/5 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-ink/40">Sample</span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-ink/50">{meta.blurb}</p>
                    </div>
                  </button>
                );
              })}
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
