import Link from "next/link";
import { ScatterRings } from "@/components/effects/ScatterRings";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[60svh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <ScatterRings />
      <p className="relative text-xs uppercase tracking-[0.3em] text-gold-bright">404</p>
      <h1 className="relative mt-2 font-display text-4xl">
        Nothing here <em className="italic text-gold-bright">yet.</em>
      </h1>
      <p className="relative mt-3 max-w-sm text-ink/60">
        That page doesn&rsquo;t exist. Poke the rings, then head back home.
      </p>
      <Link
        href="/home"
        className="focus-ring relative mt-6 rounded-full bg-ink px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white transition-transform hover:-translate-y-0.5 hover:bg-ink/85"
      >
        Back home
      </Link>
    </div>
  );
}
