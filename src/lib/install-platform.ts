// Pure device/browser detection for the "add to home screen" install guide.
// Kept free of React and DOM side effects so it's easy to read and to unit test:
// every function takes its inputs explicitly (with a `navigator`-backed default)
// instead of reaching into globals internally.

export type Platform =
  | "ios-safari"
  | "ios-other"
  | "wechat"
  | "android-chrome"
  | "samsung-internet"
  | "desktop-chrome"
  | "desktop-safari"
  | "desktop-firefox"
  | "other";

/** The platforms shown as tabs in the "Not your device?" switcher, in display order. */
export const PLATFORM_ORDER: Platform[] = [
  "ios-safari",
  "ios-other",
  "wechat",
  "android-chrome",
  "samsung-internet",
  "desktop-chrome",
  "desktop-safari",
  "desktop-firefox",
];

export interface PlatformSignals {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
}

function readNavigatorSignals(): PlatformSignals {
  if (typeof navigator === "undefined") {
    return { userAgent: "", platform: "", maxTouchPoints: 0 };
  }
  return {
    userAgent: navigator.userAgent ?? "",
    platform: navigator.platform ?? "",
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
  };
}

/**
 * Detects which install guide to show. Pass `signals` to test against a
 * specific user agent string; omit it to read from the real `navigator`.
 */
export function detectPlatform(signals: Partial<PlatformSignals> = {}): Platform {
  const { userAgent, platform, maxTouchPoints } = { ...readNavigatorSignals(), ...signals };
  const ua = userAgent;

  // In-app browsers can't install anything — catch these first regardless of OS.
  if (/MicroMessenger/i.test(ua) || /\bQQ\//i.test(ua)) return "wechat";

  const isIOSDevice = /iPad|iPhone|iPod/.test(ua) || (platform === "MacIntel" && maxTouchPoints > 1);
  if (isIOSDevice) {
    if (/CriOS|EdgiOS/.test(ua)) return "ios-other";
    return "ios-safari";
  }

  if (/Android/.test(ua)) {
    if (/SamsungBrowser/i.test(ua)) return "samsung-internet";
    return "android-chrome";
  }

  if (/Firefox/.test(ua) && !/Seamonkey/i.test(ua)) return "desktop-firefox";

  // Safari on desktop reports "Safari" but so do Chrome/Edge unless we exclude them.
  if (/Safari/.test(ua) && !/Chrome|Chromium|Edg\//.test(ua)) return "desktop-safari";

  if (/Chrome|Chromium|Edg\//.test(ua)) return "desktop-chrome";

  return "other";
}

/** True if the app is already running installed (standalone display mode). */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mediaStandalone =
    typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return Boolean(mediaStandalone || iosStandalone);
}

/** Platforms where Chromium may fire `beforeinstallprompt` and offer a one-tap install button. */
export function supportsInstallPrompt(platform: Platform): boolean {
  return platform === "android-chrome" || platform === "desktop-chrome";
}
