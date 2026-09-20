"use client";

import { EVENT_CATEGORY_GROUPS } from "@/lib/event-categories";
import { Switch } from "@/components/ui/Switch";
import type { EventCategory } from "@prisma/client";

type Props = {
  hidden: Set<EventCategory>;
  onToggle: (key: EventCategory) => void;
  onShowAll: () => void;
  onHideAll: () => void;
};

export function CategoryFilterPanel({ hidden, onToggle, onShowAll, onHideAll }: Props) {
  return (
    <div className="rounded-3xl border border-ink/10 bg-paper p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg">Event types</h2>
        <div className="flex gap-2 text-[11px] uppercase tracking-wide text-ink/45">
          <button onClick={onShowAll} className="focus-ring hover:text-ink">
            All
          </button>
          <span>·</span>
          <button onClick={onHideAll} className="focus-ring hover:text-ink">
            None
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-5">
        {EVENT_CATEGORY_GROUPS.map((group) => (
          <div key={group.group}>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.15em] text-ink/45">{group.group}</p>
            <div className="space-y-2.5">
              {group.categories.map((cat) => {
                const isHidden = hidden.has(cat.key);
                return (
                  <div key={cat.key} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm text-ink/80">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color, opacity: isHidden ? 0.35 : 1 }}
                      />
                      <span className={isHidden ? "text-ink/35" : ""}>{cat.label}</span>
                    </span>
                    <Switch checked={!isHidden} onChange={() => onToggle(cat.key)} color={cat.color} label={cat.label} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
