"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

const EATS_URL = process.env.NEXT_PUBLIC_EATS_URL ?? "https://dkueats.com";

export function EatsEmbed({ loggedIn }: { loggedIn: boolean }) {
  const [src, setSrc] = useState<string | null>(loggedIn ? null : EATS_URL);

  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;

    fetch("/api/eats/sso", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (!data?.token) {
          setSrc(EATS_URL);
          return;
        }
        const params = new URLSearchParams({
          sso: data.token,
          name: data.name ?? "",
          netId: data.netId ?? "",
          email: data.email ?? "",
        });
        setSrc(`${EATS_URL}/?${params.toString()}`);
      })
      .catch(() => {
        if (!cancelled) setSrc(EATS_URL);
      });

    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-ink/10 bg-paper">
      {src ? (
        <iframe
          src={src}
          title="DKU Eats"
          className="h-[78vh] w-full"
          allow="clipboard-write; payment"
        />
      ) : (
        <div className="flex h-[78vh] items-center justify-center text-sm text-ink/40">Loading DKU Eats…</div>
      )}
    </div>
  );
}

export function OpenInNewTab() {
  return (
    <a
      href={EATS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="focus-ring inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink"
    >
      Open in a new tab <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
