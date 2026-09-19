"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { navItems } from "@/lib/nav";

type Props = {
  userLabel: string | null;
};

export function NavBar({ userLabel }: Props) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-paper/10 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/home" className="font-display text-xl font-semibold tracking-tight">
          DKU <span className="text-gradient-gold">Life</span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`focus-ring rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-surface-raised text-gold" : "text-paper/70 hover:text-paper"
                }`}
              >
                <span className="mr-1.5">{item.emoji}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {userLabel ? (
            <>
              <span className="hidden text-sm text-paper/60 sm:inline">{userLabel}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="focus-ring rounded-full border border-paper/15 px-4 py-2 text-sm text-paper/80 hover:border-paper/40"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="focus-ring rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-bright"
            >
              Log in
            </Link>
          )}
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-3 md:hidden">
        {navItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`focus-ring whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${
                active ? "bg-surface-raised text-gold" : "text-paper/70"
              }`}
            >
              {item.emoji} {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
