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
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/home" className="focus-ring flex items-center gap-2.5 font-display text-2xl tracking-tight text-ink">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-[11px] font-semibold tracking-wide text-white">
            DK
          </span>
          DKU <em className="italic text-gold-bright">Life</em>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-7 md:flex">
          {navItems.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`link-sweep focus-ring flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors ${
                  active ? "active text-ink" : "text-ink/55 hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {userLabel ? (
            <>
              <span className="hidden text-sm text-ink/60 sm:inline">{userLabel}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="focus-ring rounded-full border border-ink/20 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-ink/75 transition-colors hover:border-ink/45 hover:text-ink"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="focus-ring rounded-full bg-ink px-5 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white transition-transform hover:-translate-y-0.5 hover:bg-ink/85"
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
                active ? "bg-paper-dim text-ink" : "text-ink/60"
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
