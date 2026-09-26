"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useOnboardingState } from "@/lib/onboardingTour";
import { OnboardingFlow } from "./OnboardingFlow";

type OnboardingTourContextValue = {
  /** Restarts the tour from the greeting, from wherever the visitor currently is. */
  replay: () => void;
};

const OnboardingTourContext = createContext<OnboardingTourContextValue | null>(null);

/** Lets any component (e.g. the "?" help menu) restart the tour on demand. */
export function useOnboardingTour() {
  const ctx = useContext(OnboardingTourContext);
  if (!ctx) throw new Error("useOnboardingTour must be used within an OnboardingProvider");
  return ctx;
}

/**
 * Mounted once near the app root (see Providers) — not inside the /home page
 * — so the tour survives client-side navigation to other tabs when a
 * deep-dive step sends the visitor to a real page (e.g. /eats) instead of
 * unmounting with whichever page first triggered it.
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { status: sessionStatus } = useSession();
  const pathname = usePathname();
  const { status, dismiss, complete, reset } = useOnboardingState();
  const [open, setOpen] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  // Auto-show once, for guests who land on /home and haven't seen it yet.
  useEffect(() => {
    if (sessionStatus === "loading" || sessionStatus === "authenticated") return;
    if (status !== "unseen" || pathname !== "/home") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true);
  }, [sessionStatus, status, pathname]);

  const replay = useCallback(() => {
    reset();
    setInstanceKey((k) => k + 1);
    setOpen(true);
  }, [reset]);

  const value = useMemo(() => ({ replay }), [replay]);

  const handleClose = useCallback(() => {
    dismiss();
    setOpen(false);
  }, [dismiss]);

  const handleComplete = useCallback(
    (interests: string[]) => {
      complete(interests);
      setOpen(false);
    },
    [complete],
  );

  return (
    <OnboardingTourContext.Provider value={value}>
      {children}
      {open ? <OnboardingFlow key={instanceKey} onClose={handleClose} onComplete={handleComplete} /> : null}
    </OnboardingTourContext.Provider>
  );
}
