"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Confetti } from "@/components/effects/Confetti";

/**
 * End-of-semester popup. `active` is decided on the server (logged in,
 * semester ended, not yet dismissed). Admins can preview it any time with
 * `?semesterPreview=1` — preview mode never writes to the server or sends a
 * notification.
 */
export function SemesterCelebration({ active, isAdmin }: { active: boolean; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const wantsPreview = isAdmin && new URLSearchParams(window.location.search).has("semesterPreview");
    if (wantsPreview) {
      // Reads window.location, which is only available after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview(true);
      setOpen(true);
    } else if (active) {
      setOpen(true);
      void fetch("/api/user/semester-celebration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "shown" }),
      }).catch(() => {});
    }
  }, [active, isAdmin]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function dismiss() {
    setOpen(false);
    if (preview) return;
    void fetch("/api/user/semester-celebration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismiss" }),
    }).catch(() => {});
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={dismiss}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="semester-celebration-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-8 text-center shadow-2xl"
      >
        <Confetti />
        <h2 id="semester-celebration-title" className="relative text-3xl font-bold text-gray-900">
          Congratulations!
        </h2>
        <p className="relative mt-3 text-gray-700">
          You made it through another session at DKU! Take some time to log your courses and rate your professors!
        </p>
        <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/courses"
            onClick={dismiss}
            className="rounded-lg bg-[#012169] px-5 py-2.5 font-semibold text-white hover:opacity-90"
          >
            Log courses
          </Link>
          <Link
            href="/professors"
            onClick={dismiss}
            className="rounded-lg bg-[#012169] px-5 py-2.5 font-semibold text-white hover:opacity-90"
          >
            Rate professors
          </Link>
        </div>
        <button type="button" onClick={dismiss} className="relative mt-4 text-sm text-gray-500 underline">
          Maybe later
        </button>
      </div>
    </div>
  );
}
