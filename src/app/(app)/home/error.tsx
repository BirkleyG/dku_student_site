"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function HomeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Home dashboard render error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">Home</p>
      <h1 className="mt-2 font-display text-3xl">The dashboard hit a snag.</h1>
      <p className="mt-3 text-sm text-ink/60">
        Something on this page failed to load. It&apos;s been logged — try again, and if it keeps happening let us know.
      </p>
      {error.digest ? <p className="mt-2 text-xs text-ink/35">Error ref: {error.digest}</p> : null}
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </div>
  );
}
