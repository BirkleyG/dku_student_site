"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, X } from "lucide-react";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import { recordPushPromptDismissal } from "./push-prompt-storage";

export type PushPromptCopy = {
  title: string;
  description: string;
};

/**
 * The one push-permission prompt UI in the app — a small dismissible toast
 * (not a blocking modal) so it never interrupts whatever the user was just
 * doing (finishing signup, RSVPing, publishing an event). Visual language
 * matches LoginModal/WelcomeModal: portaled to `<body>`, framer-motion
 * enter/exit, rounded card, gold accent.
 *
 * This component only renders the UI and wires the accept button to
 * `usePushSubscription().subscribe()` — deciding *whether* to show it (the
 * anti-nag policy) lives in `PushPromptProvider`, which is the only thing
 * that should render this with `open`.
 */
export function NotificationPermissionPrompt({
  open,
  onClose,
  copy,
}: {
  open: boolean;
  onClose: () => void;
  copy: PushPromptCopy;
}) {
  const { subscribe, state, error } = usePushSubscription();
  const [busy, setBusy] = useState(false);

  const handleDismiss = useCallback(() => {
    recordPushPromptDismissal();
    onClose();
  }, [onClose]);

  const handleEnable = useCallback(async () => {
    setBusy(true);
    await subscribe();
    setBusy(false);
    // Only close on confirmed success — the state effect below handles that.
    // On failure, `error` (from the hook) is surfaced inline instead of
    // silently dismissing the toast.
  }, [subscribe]);

  // If subscribe() succeeds (or the user grants permission for some other
  // reason while this happens to be open) close instead of lingering.
  useEffect(() => {
    if (open && state === "subscribed") onClose();
  }, [open, state, onClose]);

  // Portal to <body> only once mounted client-side, same as LoginModal — avoids
  // a server/client markup mismatch (there is no document during SSR).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-live="polite"
          aria-labelledby="push-prompt-title"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-3xl border border-ink/10 bg-white px-5 py-4 shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6"
        >
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="focus-ring absolute right-3 top-3 rounded-full p-1.5 text-ink/40 transition-colors hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex gap-3 pr-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20 text-ink">
              <Bell className="h-4 w-4" />
            </span>
            <div>
              <h2 id="push-prompt-title" className="font-display text-base text-ink">
                {copy.title}
              </h2>
              <p className="mt-1 text-sm text-ink/60">{copy.description}</p>
              {error && (
                <p role="alert" className="mt-1 text-sm text-danger">
                  {error}
                </p>
              )}

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleEnable()}
                  disabled={busy}
                  className="focus-ring rounded-full bg-gold px-4 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-gold-bright disabled:opacity-50"
                >
                  {busy ? "Enabling…" : error ? "Try again" : "Enable"}
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="focus-ring rounded-full px-3 py-1.5 text-sm text-ink/50 transition-colors hover:text-ink"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
