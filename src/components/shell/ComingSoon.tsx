"use client";

import { Reveal } from "@/components/motion/Reveal";
import { useT } from "@/lib/i18n/client";

export function ComingSoon({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  const t = useT("shell");
  return (
    <div className="mx-auto max-w-2xl py-12 text-center">
      <Reveal>
        <h1 className="font-display text-4xl">{title}</h1>
        <p className="mt-1 text-sm font-medium text-ink/40">{eyebrow}</p>
        <p className="mx-auto mt-4 max-w-md text-ink/60">{description}</p>
      </Reveal>
      {children ? (
        <Reveal delay={0.1} className="mt-8">
          {children}
        </Reveal>
      ) : null}
      <Reveal delay={0.15} className="mt-10 inline-block rounded-full border border-ink/15 px-4 py-1.5 text-xs text-ink/40">
        {t("buildingThisNext")}
      </Reveal>
    </div>
  );
}
