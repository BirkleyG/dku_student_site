"use client";

import { useOnboardingState } from "@/lib/onboardingTour";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

/**
 * The onboarding greeting + guided tour, shown to logged-out visitors on
 * `/home` until they dismiss it, finish it, or replay it from the "?" menu.
 */
export function WelcomeModal() {
  const { status, dismiss, complete } = useOnboardingState();

  if (status !== "unseen") return null;

  return <OnboardingFlow onClose={dismiss} onComplete={complete} />;
}
