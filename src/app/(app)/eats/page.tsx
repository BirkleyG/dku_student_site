import { ComingSoon } from "@/components/shell/ComingSoon";

export default function EatsPage() {
  return (
    <ComingSoon
      eyebrow="DKU Eats"
      title="Student-cooked food, on demand."
      description="Order from other students cooking and selling food and drinks on campus. DKU Eats lives at its own site for now — single sign-on with DKU Life is on the roadmap."
    >
      <a
        href="https://dkueats.com"
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-ink text-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-ink hover:text-white px-6 py-3 text-sm font-medium"
      >
        Open DKU Eats ↗
      </a>
    </ComingSoon>
  );
}
