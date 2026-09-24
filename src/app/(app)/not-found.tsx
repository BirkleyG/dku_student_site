import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl py-12 text-center">
      <Reveal>
        <h1 className="font-display text-4xl">Couldn&apos;t find that.</h1>
        <p className="mx-auto mt-4 max-w-md text-ink/60">
          This page doesn&apos;t exist or may have been removed.
        </p>
        <Link
          href="/home"
          className="focus-ring mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-bright"
        >
          Back to DKU Life
        </Link>
      </Reveal>
    </div>
  );
}
