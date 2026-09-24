"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavBar } from "./NavBar";
import { PageTransition } from "@/components/motion/PageTransition";

type Props = {
  userLabel: string | null;
  isAdmin?: boolean;
  initialStarred: string[];
  children: ReactNode;
};

// DKU Eats renders full-bleed under the header: no max-width container, no
// footer, and no background glow blobs (they'd sit behind the iframe anyway).
// Every other route keeps the normal contained layout.
export function RouteChrome({ userLabel, isAdmin, initialStarred, children }: Props) {
  const pathname = usePathname();
  const isFullBleed = pathname === "/eats";

  return (
    <>
      {!isFullBleed && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[64rem] -translate-x-1/2 rounded-full bg-sprout/25 blur-[140px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-gold/15 blur-[120px]"
          />
        </>
      )}
      <NavBar userLabel={userLabel} isAdmin={isAdmin} initialStarred={initialStarred} />
      {isFullBleed ? (
        <div className="relative z-10 flex-1">{children}</div>
      ) : (
        <>
          <div className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 py-10">
            <PageTransition>{children}</PageTransition>
          </div>
          <footer className="relative z-10 border-t border-ink/10 px-6 py-6 text-center text-xs text-ink/40">
            DKU Life ·{" "}
            <Link href="/terms" className="underline decoration-ink/30 underline-offset-2 hover:text-ink">
              Community guidelines
            </Link>
          </footer>
        </>
      )}
    </>
  );
}
