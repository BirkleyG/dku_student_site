"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { widgetCatalog, defaultWidgetOrder } from "@/lib/widgets";
import type { WidgetType } from "@prisma/client";
import { Button } from "@/components/ui/Button";

export function Customize({ initial, canSave }: { initial: WidgetType[]; canSave: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<WidgetType[]>(initial);
  const [saving, setSaving] = useState(false);

  const toggle = (type: WidgetType) => {
    setSelected((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const save = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    await fetch("/api/dashboard/widgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widgets: selected }),
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="focus-ring text-sm font-medium text-ink/60 hover:text-ink"
      >
        {open ? "Close" : "Customize dashboard"} ✦
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 flex flex-wrap gap-2">
              {defaultWidgetOrder.map((type) => {
                const active = selected.includes(type);
                const Icon = widgetCatalog[type].icon;
                return (
                  <button
                    key={type}
                    onClick={() => toggle(type)}
                    className={`focus-ring flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors ${
                      active
                        ? "border-gold bg-gold/10 text-ink"
                        : "border-ink/15 text-ink/50 hover:border-ink/35"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {widgetCatalog[type].label}
                  </button>
                );
              })}
            </div>

            {canSave ? (
              <Button onClick={save} disabled={saving} className="mt-4" variant="secondary">
                {saving ? "Saving…" : "Save layout"}
              </Button>
            ) : (
              <p className="mt-4 text-sm text-ink/40">Log in to save your dashboard layout.</p>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
