"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import { NotificationPermissionPrompt, type PushPromptCopy } from "./NotificationPermissionPrompt";
import { canAskForPushPromptAgain, isNotificationPermissionDecided } from "./push-prompt-storage";

/** The moments we ask from. Each gets its own copy so the ask feels tied to what the user just did, not a generic interruption. */
export type PushPromptTrigger = "signup" | "event-created" | "rsvp";

const COPY: Record<PushPromptTrigger, PushPromptCopy> = {
  signup: {
    title: "Stay in the loop",
    description:
      "Turn on notifications for event reminders, RSVP updates, and Board replies. You can fine-tune categories anytime in Settings.",
  },
  "event-created": {
    title: "Get notified about your event",
    description: "Turn on notifications so you catch RSVPs and updates on the event you just published.",
  },
  rsvp: {
    title: "Get a reminder before it starts?",
    description: "Turn on notifications and we'll let you know before events you're going to.",
  },
};

type PushPromptContextValue = {
  /** Ask to show the prompt for a given moment. No-ops silently if the browser has already decided permission, the user has already subscribed/opted out, or the anti-nag cooldown/cap isn't up yet — callers don't need to check any of that themselves. */
  requestPushPrompt: (trigger: PushPromptTrigger) => void;
};

const PushPromptContext = createContext<PushPromptContextValue | null>(null);

/** Call from any positive-interaction moment (creating an event, RSVPing, finishing signup, …) to opportunistically offer the push-permission prompt. Safe to call unconditionally — see `PushPromptContextValue`. */
export function useRequestPushPrompt() {
  const ctx = useContext(PushPromptContext);
  if (!ctx) throw new Error("useRequestPushPrompt must be used within a PushPromptProvider");
  return ctx.requestPushPrompt;
}

/**
 * Mounted once near the app root (see Providers) so the prompt it renders
 * survives client-side navigation triggered right after the moment that
 * asked for it (e.g. NewEventForm routes to the new event page immediately
 * after publishing) instead of unmounting with the page that requested it.
 */
export function PushPromptProvider({ children }: { children: ReactNode }) {
  const { state } = usePushSubscription();
  const [trigger, setTrigger] = useState<PushPromptTrigger | null>(null);

  const requestPushPrompt = useCallback(
    (nextTrigger: PushPromptTrigger) => {
      if (state === "subscribed" || state === "unsupported") return;
      if (isNotificationPermissionDecided()) return;
      if (!canAskForPushPromptAgain()) return;
      setTrigger(nextTrigger);
    },
    [state],
  );

  const value = useMemo(() => ({ requestPushPrompt }), [requestPushPrompt]);
  const close = useCallback(() => setTrigger(null), []);

  return (
    <PushPromptContext.Provider value={value}>
      {children}
      <NotificationPermissionPrompt open={trigger !== null} onClose={close} copy={COPY[trigger ?? "signup"]} />
    </PushPromptContext.Provider>
  );
}
