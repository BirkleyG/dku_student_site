"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { useT } from "@/lib/i18n/client";
import type { SocialPreferences } from "@/lib/social-validation";

type SaveState = "idle" | "saving" | "saved" | "error";

const selectClass =
  "rounded-lg border border-ink/15 bg-white px-2.5 py-1.5 text-sm text-ink focus:border-gold focus:outline-none";

/** Birthday and the three "who can see this about me" switches. Saved together; enforced server-side. */
export function SocialPreferencesForm({ initial }: { initial: SocialPreferences }) {
  const t = useT("friends");
  const [prefs, setPrefs] = useState(initial);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<SocialPreferences>) => {
    setPrefs((p) => ({ ...p, ...patch }));
    setState("idle");
  };

  const save = async () => {
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/user/social-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? t("saveError"));
        setState("error");
        return;
      }
      setState("saved");
    } catch {
      setError(t("saveError"));
      setState("error");
    }
  };

  const hasBirthday = prefs.birthdayMonth !== null && prefs.birthdayDay !== null;

  return (
    <Card>
      <h2 className="font-display text-2xl">{t("socialHeading")}</h2>
      <p className="mt-1 text-sm text-ink/50">{t("socialSub")}</p>

      <div className="mt-5">
        <p className="text-sm font-medium text-ink">{t("birthday")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <select
            aria-label={t("birthdayMonth")}
            value={prefs.birthdayMonth ?? ""}
            onChange={(e) => {
              const month = e.target.value ? Number(e.target.value) : null;
              update({ birthdayMonth: month, birthdayDay: month === null ? null : (prefs.birthdayDay ?? 1), showBirthday: month === null ? false : prefs.showBirthday });
            }}
            className={selectClass}
          >
            <option value="">{t("noneOption")}</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {t(`month${i + 1}`)}
              </option>
            ))}
          </select>
          <select
            aria-label={t("birthdayDay")}
            value={prefs.birthdayDay ?? ""}
            disabled={prefs.birthdayMonth === null}
            onChange={(e) => update({ birthdayDay: e.target.value ? Number(e.target.value) : null })}
            className={selectClass}
          >
            <option value="">{t("noneOption")}</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 divide-y divide-ink/10">
        {(
          [
            { key: "showBirthday", label: t("shareBirthday"), help: t("shareBirthdayHelp"), disabled: !hasBirthday },
            { key: "shareActivity", label: t("shareActivity"), help: t("shareActivityHelp"), disabled: false },
            { key: "showOnlineStatus", label: t("showOnline"), help: t("showOnlineHelp"), disabled: false },
          ] as const
        ).map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{row.label}</p>
              <p className="text-xs text-ink/50">{row.help}</p>
            </div>
            <Switch checked={prefs[row.key]} disabled={row.disabled} onChange={(v) => update({ [row.key]: v })} label={row.label} />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={state === "saving"}
          className="focus-ring rounded-full bg-ink px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-ink/85 disabled:opacity-50"
        >
          {state === "saving" ? t("saving") : t("save")}
        </button>
        {state === "saved" ? <span className="text-xs text-sprout-deep">{t("saved")}</span> : null}
        {state === "error" ? <span className="text-xs text-danger">{error ?? t("saveError")}</span> : null}
      </div>
    </Card>
  );
}
