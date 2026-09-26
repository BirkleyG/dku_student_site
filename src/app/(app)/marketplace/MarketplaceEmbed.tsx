"use client";

import { ExternalLink } from "lucide-react";
import { useT } from "@/lib/i18n/client";

const MARKET_URL = process.env.NEXT_PUBLIC_MARKET_URL ?? "https://dku-market.kimi.site/";

export function MarketplaceEmbed() {
  const t = useT("marketplace");
  return (
    <div data-tour="marketplace-embed" className="relative h-[calc(100svh-var(--header-h))] w-full overflow-hidden bg-paper">
      <iframe src={MARKET_URL} title={t("embedTitle")} className="h-full w-full" allow="clipboard-write" />
    </div>
  );
}

export function OpenInNewTab() {
  const t = useT("marketplace");
  return (
    <a
      href={MARKET_URL}
      target="_blank"
      rel="noopener noreferrer"
      title={t("openInNewTab")}
      className="focus-ring absolute bottom-5 right-5 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-white/90 text-ink/50 shadow-sm backdrop-blur-sm transition hover:text-ink"
    >
      <ExternalLink className="h-4 w-4" />
      <span className="sr-only">{t("openInNewTab")}</span>
    </a>
  );
}
