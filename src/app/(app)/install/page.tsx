"use client";

import { useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { InstallGuide } from "@/components/install/InstallGuide";
import { useLocale } from "@/lib/i18n/client";

type Lang = "en" | "zh";

const copy = {
  en: { eyebrow: "Get the app", english: "English", chinese: "中文" },
  zh: { eyebrow: "获取应用", english: "English", chinese: "中文" },
} as const;

const heading = { en: "Add DKU Life to your home screen", zh: "把 DKU Life 添加到主屏幕" };
const sub = {
  en: "It opens instantly, fills the screen, and feels like a real app.",
  zh: "这样打开更快，全屏显示，用起来就像真正的 App。",
};

export default function InstallPage() {
  const { locale } = useLocale();
  const [lang, setLang] = useState<Lang>(locale);
  const t = copy[lang];

  return (
    <Reveal>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.4em] text-gold-bright">{t.eyebrow}</p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setLang("en")}
              className={`focus-ring rounded-full px-3 py-1 text-xs font-medium ${
                lang === "en" ? "bg-ink text-white" : "border border-ink/15 text-ink/60 hover:text-ink"
              }`}
            >
              {t.english}
            </button>
            <button
              onClick={() => setLang("zh")}
              className={`focus-ring rounded-full px-3 py-1 text-xs font-medium ${
                lang === "zh" ? "bg-ink text-white" : "border border-ink/15 text-ink/60 hover:text-ink"
              }`}
            >
              {t.chinese}
            </button>
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-semibold text-ink">{heading[lang]}</h1>
        <p className="mb-8 text-sm text-ink/60">{sub[lang]}</p>

        <InstallGuide lang={lang} />
      </div>
    </Reveal>
  );
}
