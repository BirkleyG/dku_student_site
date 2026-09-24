"use client";

import { useState } from "react";
import type { NotificationCategory } from "@prisma/client";
import { Card } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { NOTIFICATION_CATEGORIES } from "@/lib/notification-categories";

type Props = {
  initialPreferences: Record<NotificationCategory, boolean>;
};

type SaveState = "idle" | "saving" | "error";

export function NotificationPreferencesForm({ initialPreferences }: Props) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [saveStates, setSaveStates] = useState<Partial<Record<NotificationCategory, SaveState>>>({});

  async function handleToggle(category: NotificationCategory, next: boolean) {
    const previous = preferences[category];
    setPreferences((p) => ({ ...p, [category]: next }));
    setSaveStates((s) => ({ ...s, [category]: "saving" }));

    try {
      const res = await fetch("/api/user/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, enabled: next }),
      });
      if (!res.ok) throw new Error("Request failed");
      setSaveStates((s) => ({ ...s, [category]: "idle" }));
    } catch {
      // Roll back on failure so the toggle reflects what's actually saved.
      setPreferences((p) => ({ ...p, [category]: previous }));
      setSaveStates((s) => ({ ...s, [category]: "error" }));
    }
  }

  return (
    <Card>
      <div className="space-y-5">
        {NOTIFICATION_CATEGORIES.map((cat) => {
          const enabled = preferences[cat.key];
          const saveState = saveStates[cat.key] ?? "idle";
          return (
            <div key={cat.key} className="flex items-start justify-between gap-4 border-b border-ink/10 pb-5 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-ink/85">{cat.label}</p>
                <p className="mt-0.5 text-xs text-ink/50">{cat.description}</p>
                {saveState === "error" && (
                  <p className="mt-1 text-xs text-danger">Couldn&apos;t save — try again.</p>
                )}
              </div>
              <Switch checked={enabled} onChange={(next) => handleToggle(cat.key, next)} label={cat.label} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
