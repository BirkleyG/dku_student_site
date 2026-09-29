"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/Switch";
import { useT } from "@/lib/i18n/client";

export function LeaderboardToggle({ initial }: { initial: boolean }) {
  const t = useT("profile");
  const [show, setShow] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function change(next: boolean) {
    setShow(next);
    setSaving(true);
    try {
      const res = await fetch("/api/user/leaderboard-preference", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show: next }),
      });
      if (!res.ok) setShow(!next);
    } catch {
      setShow(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-paper-dim p-4">
      <div>
        <p className="text-sm font-medium">{t("showOnLeaderboard")}</p>
        <p className="text-xs text-ink/50">{t("showOnLeaderboardHint")}</p>
      </div>
      <Switch checked={show} onChange={change} disabled={saving} label={t("showOnLeaderboard")} />
    </div>
  );
}
