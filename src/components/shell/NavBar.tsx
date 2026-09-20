"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { navItems } from "@/lib/nav";

type Props = {
  userLabel: string | null;
};

export function NavBar({ userLabel }: Props) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-paper/10 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/home" className="focus-ring flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-gold to-teal text-xs font-bold text-ink">
            DK
          </span>
          DKU <span className="text-gradient-gold">Life</span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`focus-ring relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active ? "text-gold" : "text-paper/70 hover:text-paper"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-full bg-surface-raised"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                ) : null}
                <span className="relative flex items-center gap-1.5">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                  {item.label}
                </span>
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
                className="focus-ring rounded-full border border-paper/15 px-4 py-2 text-sm text-paper/80 transition-colors hover:border-paper/40 hover:text-paper"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="focus-ring rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink transition-transform hover:-translate-y-0.5 hover:bg-gold-bright"
            >
              Log in
            </Link>
          )}
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-3 md:hidden">
        {navItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`focus-ring flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${
                active ? "bg-surface-raised text-gold" : "text-paper/70"
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
