"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NotificationCategory } from "@prisma/client";
import { Card } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { NOTIFICATION_CATEGORIES } from "@/lib/notification-categories";
import { useT } from "@/lib/i18n/client";
import { usePushSubscription } from "@/hooks/use-push-subscription";

type Props = {
  initialPreferences: Record<NotificationCategory, boolean>;
};

type SaveState = "idle" | "saving" | "error";

const CATEGORY_LABEL_KEYS: Record<NotificationCategory, string> = {
  EVENTS: "catEventsLabel",
  MESSAGES: "catMessagesLabel",
  RECOMMENDATIONS: "catRecommendationsLabel",
  ORDERS: "catOrdersLabel",
};
const CATEGORY_DESCRIPTION_KEYS: Record<NotificationCategory, string> = {
  EVENTS: "catEventsDescription",
  MESSAGES: "catMessagesDescription",
  RECOMMENDATIONS: "catRecommendationsDescription",
  ORDERS: "catOrdersDescription",
};

/**
 * Reads the real, live `Notification.permission` value (not just the
 * push-subscription hook's cached state) so a user who blocks notifications
 * at the OS/browser level sees that immediately, including after they come
 * back to this tab having changed it in browser settings.
 */
function usePermission(): NotificationPermission | "unsupported" {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission;
  });

  useEffect(() => {
    if (!("Notification" in window)) return;
    const sync = () => setPermission(Notification.permission);
    sync();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return permission;
}

export function NotificationPreferencesForm({ initialPreferences }: Props) {
  const t = useT("settings");
  const [preferences, setPreferences] = useState(initialPreferences);
  const [saveStates, setSaveStates] = useState<Partial<Record<NotificationCategory, SaveState>>>({});
  const { state, error, subscribe, unsubscribe } = usePushSubscription();
  const permission = usePermission();
  const [busy, setBusy] = useState(false);

  const isSubscribed = state === "subscribed";
  const isUnsupported = state === "unsupported" || permission === "unsupported";
  const isDenied = permission === "denied";

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

  async function handleEnablePush() {
    setBusy(true);
    await subscribe();
    setBusy(false);
  }

  async function handleDisablePush() {
    setBusy(true);
    await unsubscribe();
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      <Card>
        <p className="text-sm font-medium text-ink/85">{t("pushHeading")}</p>

        {isDenied ? (
          <div className="mt-3">
            <p className="text-sm text-ink/70">{t("pushDeniedTitle")}</p>
            <p className="mt-0.5 text-xs text-ink/50">{t("pushDeniedDescription")}</p>
            <Link href="/install" className="focus-ring mt-2 inline-block text-xs font-medium text-gold-bright underline">
              {t("pushDeniedInstallLink")}
            </Link>
          </div>
        ) : isUnsupported ? (
          <div className="mt-3">
            <p className="text-sm text-ink/70">{t("pushUnsupportedTitle")}</p>
            <p className="mt-0.5 text-xs text-ink/50">{t("pushUnsupportedDescription")}</p>
          </div>
        ) : isSubscribed ? (
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-ink/70">{t("pushSubscribedTitle")}</p>
              <p className="mt-0.5 text-xs text-ink/50">{t("pushSubscribedDescription")}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleDisablePush()}
              disabled={busy}
              className="focus-ring shrink-0 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:text-ink disabled:opacity-50"
            >
              {busy ? t("pushDisablingButton") : t("pushDisableButton")}
            </button>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-ink/70">{t("pushUnsubscribedTitle")}</p>
            <p className="mt-0.5 text-xs text-ink/50">{t("pushUnsubscribedDescription")}</p>
            <button
              type="button"
              onClick={() => void handleEnablePush()}
              disabled={busy}
              className="focus-ring mt-3 rounded-full bg-gold px-4 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-gold-bright disabled:opacity-50"
            >
              {busy ? t("pushEnablingButton") : t("pushEnableButton")}
            </button>
            {error && <p className="mt-2 text-xs text-danger">{error}</p>}
          </div>
        )}
      </Card>

      <Card>
        <div className="space-y-5">
          {!isSubscribed && (
            <p className="text-xs text-ink/50">{t("pushGatedNote")}</p>
          )}
          {NOTIFICATION_CATEGORIES.map((cat) => {
            const enabled = preferences[cat.key];
            const saveState = saveStates[cat.key] ?? "idle";
            return (
              <div
                key={cat.key}
                className={`flex items-start justify-between gap-4 border-b border-ink/10 pb-5 last:border-0 last:pb-0 ${
                  isSubscribed ? "" : "opacity-50"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-ink/85">{t(CATEGORY_LABEL_KEYS[cat.key])}</p>
                  <p className="mt-0.5 text-xs text-ink/50">{t(CATEGORY_DESCRIPTION_KEYS[cat.key])}</p>
                  {saveState === "error" && (
                    <p className="mt-1 text-xs text-danger">{t("couldntSave")}</p>
                  )}
                </div>
                <Switch
                  checked={enabled}
                  onChange={(next) => handleToggle(cat.key, next)}
                  label={t(CATEGORY_LABEL_KEYS[cat.key])}
                  disabled={!isSubscribed}
                />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
