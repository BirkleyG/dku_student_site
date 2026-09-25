"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export function BackHome({ className = "" }: { className?: string }) {
  const t = useT("shell");
  return (
    <Link
      href="/home"
      className={`focus-ring inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-ink/50 transition-colors hover:text-ink ${className}`}
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
      {t("backToDkuLife")}
    </Link>
  );
}
