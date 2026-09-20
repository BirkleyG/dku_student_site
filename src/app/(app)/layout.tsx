import Link from "next/link";
import { auth } from "@/lib/auth";
import { NavBar } from "@/components/shell/NavBar";
import { PageTransition } from "@/components/motion/PageTransition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userLabel = session?.user?.name ?? null;

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[64rem] -translate-x-1/2 rounded-full bg-sprout/25 blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-gold/15 blur-[120px]"
      />
      <NavBar userLabel={userLabel} />
      <div className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <PageTransition>{children}</PageTransition>
      </div>
      <footer className="relative z-10 border-t border-ink/10 px-6 py-6 text-center text-xs text-ink/40">
        DKU Life ·{" "}
        <Link href="/terms" className="underline decoration-ink/30 underline-offset-2 hover:text-ink">
          Community guidelines
        </Link>
      </footer>
    </div>
  );
}
