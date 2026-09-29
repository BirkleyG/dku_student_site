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
export function SemesterCelebration({
  active,
  isAdmin,
  semesterKey,
  kind = "semester",
  label = null,
}: {
  active: boolean;
  isAdmin: boolean;
  /** Ended semester being celebrated; enables the link to its Semester in Review. */
  semesterKey?: string | null;
  /** "session" = mid-semester session ended; "semester" = the whole semester ended. */
  kind?: "semester" | "session";
  /** Name of the session/semester being celebrated, e.g. "Fall Session 1". */
  label?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewKind, setPreviewKind] = useState<"semester" | "session" | null>(null);

  useEffect(() => {
    const previewParam = isAdmin ? new URLSearchParams(window.location.search).get("semesterPreview") : null;
    if (previewParam !== null) {
      // Reads window.location, which is only available after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview(true);
      setPreviewKind(previewParam === "session" ? "session" : "semester");
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

  const shownKind = preview && previewKind ? previewKind : kind;
  const isSession = shownKind === "session";
  const sessionLabel = preview ? "Fall Session 1" : label ?? "this session";
  const reviewKey = isSession ? null : semesterKey;

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
          {isSession ? `Congrats on finishing ${sessionLabel}!` : "Congratulations!"}
        </h2>
        <p className="relative mt-3 text-gray-700">
          {isSession
            ? "Seven weeks down! Take a moment to log your courses and rate your professors while it's still fresh."
            : "You made it through another session at DKU! Take some time to log your courses and rate your professors!"}
        </p>
        {reviewKey ? (
          <Link
            href={`/profile?review=${encodeURIComponent(reviewKey)}`}
            onClick={dismiss}
            className="relative mt-6 block rounded-lg bg-gold-bright px-5 py-2.5 font-semibold text-ink hover:opacity-90"
          >
            See your Semester in Review
          </Link>
        ) : null}
        <div className={`relative flex flex-col gap-3 sm:flex-row sm:justify-center ${reviewKey ? "mt-3" : "mt-6"}`}>
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
