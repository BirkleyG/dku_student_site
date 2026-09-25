"use client";

import { Languages } from "lucide-react";
import { useLocale } from "@/lib/i18n/client";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const next = locale === "en" ? "zh" : "en";

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={locale === "en" ? "Switch to Chinese" : "切换到英文"}
      className={`focus-ring inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:border-ink/40 hover:text-ink ${className}`}
    >
      <Languages className="h-3.5 w-3.5" strokeWidth={1.75} />
      {locale === "en" ? "中文" : "EN"}
    </button>
  );
}
