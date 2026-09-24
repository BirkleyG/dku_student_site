"use client";

import { ExternalLink } from "lucide-react";

const MARKET_URL = process.env.NEXT_PUBLIC_MARKET_URL ?? "https://dku-market.kimi.site/";

export function MarketplaceEmbed() {
  return (
    <div className="relative h-[calc(100svh-var(--header-h))] w-full overflow-hidden bg-paper">
      <iframe src={MARKET_URL} title="DKU Marketplace" className="h-full w-full" allow="clipboard-write" />
    </div>
  );
}

export function OpenInNewTab() {
  return (
    <a
      href={MARKET_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Open DKU Marketplace in a new tab"
      className="focus-ring absolute bottom-5 right-5 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-white/90 text-ink/50 shadow-sm backdrop-blur-sm transition hover:text-ink"
    >
      <ExternalLink className="h-4 w-4" />
      <span className="sr-only">Open in a new tab</span>
    </a>
  );
}
