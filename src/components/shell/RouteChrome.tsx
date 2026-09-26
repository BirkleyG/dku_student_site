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
  initialStarredMobile: string[];
  communityScore?: number | null;
  children: ReactNode;
};

// DKU Eats and Chat render full-bleed under the header: no max-width
// container and no footer — Chat needs the full viewport height for its
// sidebar/thread layout. Every other route keeps the normal contained layout.
export function RouteChrome({ userLabel, isAdmin, initialStarred, initialStarredMobile, communityScore, children }: Props) {
  const pathname = usePathname();
  const isFullBleed = pathname === "/eats" || pathname === "/chat";

  return (
    <>
      <NavBar
        userLabel={userLabel}
        isAdmin={isAdmin}
        initialStarred={initialStarred}
        initialStarredMobile={initialStarredMobile}
        communityScore={communityScore}
      />
      {isFullBleed ? (
        <div className="relative z-10 flex-1">{children}</div>
      ) : (
        <>
          {/* Extra bottom padding on mobile clears the fixed bottom tab bar. */}
          <div className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 pt-10 pb-24 sm:pb-10">
            <PageTransition>{children}</PageTransition>
          </div>
          <footer className="relative z-10 border-t border-ink/10 px-6 pt-6 pb-24 text-center text-xs text-ink/40 sm:pb-6">
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
