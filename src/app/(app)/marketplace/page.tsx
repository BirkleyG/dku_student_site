import { ComingSoon } from "@/components/shell/ComingSoon";

export default function MarketplacePage() {
  return (
    <ComingSoon
      eyebrow="DKU Marketplace"
      title="Buy and sell with your dorm mates."
      description="Textbooks, furniture, bikes, whatever you don't need anymore. DKU Marketplace lives at its own site for now; single sign-on with DKU Life is on the roadmap."
    >
      <a
        href="https://dku-market.kimi.site/"
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-ink text-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-ink hover:text-white px-6 py-3 text-sm font-medium"
      >
        Open DKU Marketplace ↗
      </a>
    </ComingSoon>
  );
}
