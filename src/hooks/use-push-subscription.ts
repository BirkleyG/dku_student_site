"use client";

import { useCallback, useEffect, useState } from "react";

type PushSubscriptionState = "unsupported" | "unknown" | "unsubscribed" | "subscribed";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Client-side glue for Web Push: registers/subscribes through the service
 * worker (registered separately by RegisterServiceWorker) and syncs the
 * subscription with the server via /api/push/subscribe and /api/push/unsubscribe.
 *
 * This is the minimal subscribe hook the push-notifications-infra card
 * calls for; it deliberately doesn't render any UI — the
 * "[Notifications] Per-category notification preferences in Settings" card
 * owns the opt-in/opt-out surface and can build on top of this hook.
 */
export function usePushSubscription() {
  const [state, setState] = useState<PushSubscriptionState>("unknown");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      setState(existing ? "subscribed" : "unsubscribed");
    } catch {
      setState("unsupported");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from an external system (the service worker's PushManager), not derivable from props/state.
    refresh();
  }, [refresh]);

  const subscribe = useCallback(async () => {
    setError(null);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState("unsupported");
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setError("Push notifications aren't configured yet.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notification permission was not granted.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const json = subscription.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save subscription");
      }

      setState("subscribed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to subscribe");
      setState("unsubscribed");
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        }).catch(() => {});
      }
      setState("unsubscribed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unsubscribe");
    }
  }, []);

  return { state, error, subscribe, unsubscribe, refresh };
}
