"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, X } from "lucide-react";
import { SunPulse } from "@/components/effects/SunPulse";
import { useT } from "@/lib/i18n/client";

const EATS_URL = process.env.NEXT_PUBLIC_EATS_URL ?? "https://dkueats.com";

export function EatsEmbed({ loggedIn }: { loggedIn: boolean }) {
  const t = useT("eats");
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
    <div data-tour="eats-embed" className="relative h-[calc(100svh-var(--header-h))] w-full overflow-hidden bg-paper">
      {src ? (
        <iframe src={src} title={t("embedTitle")} className="h-full w-full" allow="clipboard-write; payment" />
      ) : (
        <EatsLoading />
      )}
    </div>
  );
}

function EatsLoading() {
  const t = useT("eats");
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
      <SunPulse ringCount={3} />
      <p className="relative text-sm text-ink/40">{t("loading")}</p>
    </div>
  );
}

export function OpenInNewTab() {
  const t = useT("eats");
  return (
    <a
      href={EATS_URL}
      target="_blank"
      rel="noopener noreferrer"
      title={t("openInNewTab")}
      className="focus-ring absolute bottom-5 right-5 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-white/90 text-ink/50 shadow-sm backdrop-blur-sm transition hover:text-ink"
    >
      <ExternalLink className="h-4 w-4" />
      <span className="sr-only">{t("openInNewTab")}</span>
    </a>
  );
}

export function GuestNote() {
  const t = useT("eats");
  const [dismissed, setDismissed] = useState(false);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-5 left-5 z-20 flex max-w-xs items-start gap-2 rounded-2xl border border-ink/10 bg-white/95 px-4 py-3 text-sm text-ink/70 shadow-lg backdrop-blur-sm"
        >
          <p className="flex-1">{t("guestNote")}</p>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="focus-ring -m-1 shrink-0 rounded-full p-1 text-ink/40 hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">{t("dismiss")}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
