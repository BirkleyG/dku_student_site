"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export function NewPlanModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const t = useT("planner");
  const [name, setName] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-lg border border-ink/10 bg-paper p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg">{t("newPlanTitle")}</h3>
          <button onClick={onClose} className="focus-ring text-ink/40 hover:text-ink" aria-label={t("cancel")}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={t("planNameInputLabel")}
          className="focus-ring mt-4 w-full rounded-xl border border-ink/15 bg-paper-dim px-3 py-2 text-sm"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="focus-ring rounded-full px-4 py-2 text-sm text-ink/60">
            {t("cancel")}
          </button>
          <button onClick={submit} className="focus-ring rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-bright">
            {t("createPlanButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
