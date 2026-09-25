"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "dku-life:onboarding-v2";

export type OnboardingStatus = "unseen" | "dismissed" | "completed";

type OnboardingState = {
  status: OnboardingStatus;
  interests: string[] | null;
};

const DEFAULT_STATE: OnboardingState = { status: "unseen", interests: null };
// Assume "dismissed" for the server-rendered snapshot so the popup never
// flashes open on the initial paint before hydration can check localStorage
// — it can only appear once we know that's correct. Must be a stable
// reference (not a fresh object per call) or useSyncExternalStore loops.
const SERVER_SNAPSHOT: OnboardingState = { status: "dismissed", interests: null };

// useSyncExternalStore requires getSnapshot to return a referentially stable
// value when nothing changed (it's called on every render to check for
// tearing) — cache by the raw string so unrelated re-renders don't parse a
// fresh object each time and trigger an infinite re-render loop.
let cachedRaw: string | null | undefined;
let cachedState: OnboardingState = DEFAULT_STATE;

function readState(): OnboardingState {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return DEFAULT_STATE;
  }
  if (raw === cachedRaw) return cachedState;
  cachedRaw = raw;

  if (!raw) {
    cachedState = DEFAULT_STATE;
    return cachedState;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    cachedState =
      parsed.status === "unseen" || parsed.status === "dismissed" || parsed.status === "completed"
        ? { status: parsed.status, interests: Array.isArray(parsed.interests) ? parsed.interests : null }
        : DEFAULT_STATE;
  } catch {
    cachedState = DEFAULT_STATE;
  }
  return cachedState;
}

function writeState(state: OnboardingState) {
  try {
    const raw = JSON.stringify(state);
    window.localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedState = state;
    listeners.forEach((l) => l());
  } catch {
    // Private mode / blocked storage: the popup just shows again next visit.
  }
}

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Guest-only onboarding popup state, mirroring the pattern in `useStarredNav`. */
export function useOnboardingState() {
  const state = useSyncExternalStore(subscribe, readState, () => SERVER_SNAPSHOT);

  const dismiss = useCallback(() => writeState({ status: "dismissed", interests: state.interests }), [state.interests]);
  const complete = useCallback((interests: string[]) => writeState({ status: "completed", interests }), []);
  const reset = useCallback(() => writeState(DEFAULT_STATE), []);

  return { ...state, dismiss, complete, reset };
}
