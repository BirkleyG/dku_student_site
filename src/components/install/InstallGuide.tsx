"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share,
  SquarePlus,
  EllipsisVertical,
  Ellipsis,
  MonitorDown,
  Menu,
  CheckCircle2,
  Download,
} from "lucide-react";
import {
  detectPlatform,
  isStandalone,
  supportsInstallPrompt,
  PLATFORM_ORDER,
  type Platform,
} from "@/lib/install-platform";

type Lang = "en" | "zh";
type Step = { icon: typeof Share; text: string };

interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

// Read through useSyncExternalStore rather than an effect + setState: the
// platform never changes at runtime, and "installed" status only ever changes
// in response to the real `appinstalled` event, so both fit the "subscribe to
// an external system" model instead of a synchronous effect-time setState.
function subscribeNever() {
  return () => {};
}
function getServerPlatform(): Platform {
  return "other";
}
function subscribeInstalled(onChange: () => void) {
  window.addEventListener("appinstalled", onChange);
  return () => window.removeEventListener("appinstalled", onChange);
}
function getServerInstalled() {
  return false;
}

const platformLabel: Record<Platform, { en: string; zh: string }> = {
  "ios-safari": { en: "iPhone / iPad · Safari", zh: "iPhone / iPad · Safari" },
  "ios-other": { en: "iPhone / iPad · Chrome or Edge", zh: "iPhone / iPad · Chrome 或 Edge" },
  wechat: { en: "WeChat / QQ browser", zh: "微信 / QQ 内置浏览器" },
  "android-chrome": { en: "Android · Chrome", zh: "安卓 · Chrome" },
  "samsung-internet": { en: "Samsung Internet", zh: "三星浏览器" },
  "desktop-chrome": { en: "Desktop · Chrome / Edge", zh: "电脑 · Chrome / Edge" },
  "desktop-safari": { en: "Desktop · Safari", zh: "电脑 · Safari" },
  "desktop-firefox": { en: "Desktop · Firefox", zh: "电脑 · Firefox" },
  other: { en: "Other browser", zh: "其他浏览器" },
};

const copy = {
  en: {
    heading: "Add DKU Life to your home screen",
    subheading: "It opens instantly, fills the screen, and feels like a real app.",
    notYourDevice: "Not your device?",
    installedTitle: "You're all set ✓",
    installedBody: "DKU Life is already installed on this device.",
    installButton: "Install DKU Life",
    installing: "Installing…",
    installed: "Installed",
    steps: (): Record<Platform, { note?: string; steps: Step[] }> => ({
      "ios-safari": {
        steps: [
          { icon: Share, text: "Tap **Share** (the square with an arrow pointing up) in Safari's toolbar." },
          { icon: SquarePlus, text: "Scroll down and tap **Add to Home Screen**." },
          { icon: CheckCircle2, text: "Tap **Add** in the top right." },
        ],
      },
      "ios-other": {
        steps: [
          { icon: Share, text: "Tap the **Share** icon in the address bar." },
          { icon: SquarePlus, text: "Tap **Add to Home Screen**." },
          { icon: CheckCircle2, text: "Tap **Add** to confirm." },
        ],
      },
      wechat: {
        note: "You can't install apps from inside WeChat or QQ. Open this page in your real browser first.",
        steps: [
          { icon: Ellipsis, text: "Tap **···** in the top right corner." },
          { icon: Share, text: "Choose **Open in Browser**." },
          { icon: CheckCircle2, text: "Then follow the steps for whichever browser opens." },
        ],
      },
      "android-chrome": {
        steps: [
          { icon: EllipsisVertical, text: "Tap the **⋮** menu in the top right." },
          { icon: Download, text: "Tap **Install app** (or **Add to Home screen**)." },
        ],
      },
      "samsung-internet": {
        steps: [
          { icon: Menu, text: "Tap the **≡** menu." },
          { icon: SquarePlus, text: "Tap **Add page to**, then **Home screen**." },
        ],
      },
      "desktop-chrome": {
        steps: [
          {
            icon: MonitorDown,
            text: "Click the install icon (a monitor with a down arrow) at the right of the address bar, or open the menu and choose **Install DKU Life**.",
          },
        ],
      },
      "desktop-safari": {
        steps: [
          { icon: Menu, text: "Open the **File** menu." },
          { icon: SquarePlus, text: "Choose **Add to Dock**." },
        ],
      },
      "desktop-firefox": {
        note: "Firefox doesn't support installing DKU Life yet. Try Chrome or Edge, or bookmark this page (Ctrl/Cmd + D).",
        steps: [],
      },
      other: {
        note: "Look for an install icon in your browser's address bar, or open its menu and choose \"Install DKU Life\" / \"Add to Home screen.\"",
        steps: [],
      },
    }),
  },
  zh: {
    heading: "把 DKU Life 添加到主屏幕",
    subheading: "这样打开更快，全屏显示，用起来就像真正的 App。",
    notYourDevice: "不是你的设备？",
    installedTitle: "你已经装好了 ✓",
    installedBody: "这台设备上已经安装了 DKU Life。",
    installButton: "安装 DKU Life",
    installing: "安装中…",
    installed: "已安装",
    steps: (): Record<Platform, { note?: string; steps: Step[] }> => ({
      "ios-safari": {
        steps: [
          { icon: Share, text: "在 Safari 工具栏中点击**分享**图标（带向上箭头的方框）。" },
          { icon: SquarePlus, text: "向下滚动并点击**添加到主屏幕**。" },
          { icon: CheckCircle2, text: "点击右上角的**添加**。" },
        ],
      },
      "ios-other": {
        steps: [
          { icon: Share, text: "点击地址栏中的**分享**图标。" },
          { icon: SquarePlus, text: "点击**添加到主屏幕**。" },
          { icon: CheckCircle2, text: "点击**添加**确认。" },
        ],
      },
      wechat: {
        note: "微信和 QQ 内置浏览器无法安装应用——请先在真正的浏览器中打开此页面。",
        steps: [
          { icon: Ellipsis, text: "点击右上角的**···**。" },
          { icon: Share, text: "选择**在浏览器中打开**。" },
          { icon: CheckCircle2, text: "然后按照打开的浏览器的步骤操作。" },
        ],
      },
      "android-chrome": {
        steps: [
          { icon: EllipsisVertical, text: "点击右上角的**⋮**菜单。" },
          { icon: Download, text: "点击**安装应用**（或**添加到主屏幕**）。" },
        ],
      },
      "samsung-internet": {
        steps: [
          { icon: Menu, text: "点击**≡**菜单。" },
          { icon: SquarePlus, text: "点击**添加页面至**，然后选择**主屏幕**。" },
        ],
      },
      "desktop-chrome": {
        steps: [
          {
            icon: MonitorDown,
            text: "点击地址栏右侧的安装图标（带下载箭头的显示器），或打开菜单选择**安装 DKU Life**。",
          },
        ],
      },
      "desktop-safari": {
        steps: [
          { icon: Menu, text: "打开**文件**菜单。" },
          { icon: SquarePlus, text: "选择**添加到程序坞**。" },
        ],
      },
      "desktop-firefox": {
        note: "Firefox 暂不支持安装 DKU Life。可以试试 Chrome 或 Edge，或将此页加入书签（Ctrl/Cmd + D）。",
        steps: [],
      },
      other: {
        note: "在浏览器地址栏中查找安装图标，或打开菜单选择“安装 DKU Life” / “添加到主屏幕”。",
        steps: [],
      },
    }),
  },
} as const;

/** Renders `**bold**` spans within an otherwise plain instruction string. */
function renderBold(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function InstallGuide({ lang, className = "" }: { lang: Lang; className?: string }) {
  const t = copy[lang];

  // Detected once per mount from the real navigator; never changes afterwards.
  const detectedPlatform = useSyncExternalStore(subscribeNever, detectPlatform, getServerPlatform);
  const [manualPlatform, setManualPlatform] = useState<Platform | null>(null);
  const platform = manualPlatform ?? detectedPlatform;

  // Tracks the real `appinstalled` event / standalone display mode.
  const installed = useSyncExternalStore(subscribeInstalled, isStandalone, getServerInstalled);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installState, setInstallState] = useState<"idle" | "installing" | "installed">("idle");

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setInstallState("installed");
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const perPlatform = useMemo(() => t.steps(), [t]);
  const active = perPlatform[platform];
  const canPrompt = supportsInstallPrompt(platform) && Boolean(deferredPrompt);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setInstallState("installing");
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstallState("installed");
      } else {
        setInstallState("idle");
      }
    } catch {
      setInstallState("idle");
    } finally {
      setDeferredPrompt(null);
    }
  };

  if (installed) {
    return (
      <div className={`rounded-2xl border border-sprout-deep/20 bg-sprout/10 px-5 py-4 ${className}`}>
        <p className="flex items-center gap-2 font-semibold text-ink">
          <CheckCircle2 className="h-5 w-5 text-sprout-deep" aria-hidden />
          {t.installedTitle}
        </p>
        <p className="mt-1 text-sm text-ink/70">{t.installedBody}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label={t.notYourDevice}>
        {PLATFORM_ORDER.map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={platform === p}
            onClick={() => setManualPlatform(p)}
            className={`focus-ring rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              platform === p ? "bg-ink text-white" : "border border-ink/15 text-ink/60 hover:border-ink/30 hover:text-ink"
            }`}
          >
            {platformLabel[p][lang]}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={platform}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {active.note ? (
            <p className="mb-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-ink/80">
              {active.note}
            </p>
          ) : null}

          {canPrompt ? (
            <button
              onClick={handleInstallClick}
              disabled={installState === "installing"}
              className="focus-ring mb-4 flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-ink transition-transform hover:-translate-y-0.5 hover:bg-gold-bright disabled:opacity-60"
            >
              <MonitorDown className="h-4 w-4" aria-hidden />
              {installState === "installing" ? t.installing : t.installButton}
            </button>
          ) : null}

          {active.steps.length > 0 ? (
            <ol className="space-y-3">
              {active.steps.map((step, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-3 rounded-xl bg-paper-dim px-4 py-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  <step.icon className="mt-0.5 h-5 w-5 shrink-0 text-ink/50" aria-hidden />
                  <span className="text-sm text-ink/80">{renderBold(step.text)}</span>
                </motion.li>
              ))}
            </ol>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
