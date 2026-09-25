"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny pub-sub bridges so the onboarding tour (rendered near the top of the
 * app) can remote-control a couple of pieces of UI it doesn't own — opening
 * the nav drawer and flipping the dashboard into edit mode — without prop
 * drilling through the whole shell.
 */
function createBoolBridge() {
  let value = false;
  const listeners = new Set<() => void>();
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  };
  const set = (next: boolean) => {
    if (value === next) return;
    value = next;
    listeners.forEach((l) => l());
  };
  const useValue = () => useSyncExternalStore(subscribe, () => value, () => false);
  return { set, useValue };
}

export const navMenuTourBridge = createBoolBridge();
export const dashboardEditTourBridge = createBoolBridge();
