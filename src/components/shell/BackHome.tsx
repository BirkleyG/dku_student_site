import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackHome({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/home"
      className={`focus-ring inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-ink/50 transition-colors hover:text-ink ${className}`}
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
      Back to DKU Life
    </Link>
  );
}
