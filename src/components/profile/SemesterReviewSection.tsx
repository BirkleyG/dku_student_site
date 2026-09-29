"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MoreHorizontal, Sparkles } from "lucide-react";
import type { ReviewSemesterInfo, SemesterReviewData } from "@/lib/semester-review";
import { SemesterStory } from "./SemesterStory";

type ApiResponse = { semesters: ReviewSemesterInfo[]; review: SemesterReviewData | null; preview: boolean };

/**
 * Profile-page entry point for "Semester in Review". Fetches read-only data
 * from /api/user/semester-review; renders nothing until a semester has ended
 * (admins can force it with `?reviewPreview=1`, which never writes anything).
 * `?review=<semesterKey>` (used by the end-of-semester popup) opens the story.
 */
export function SemesterReviewSection() {
  const [semesters, setSemesters] = useState<ReviewSemesterInfo[]>([]);
  const [review, setReview] = useState<SemesterReviewData | null>(null);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [storyOpen, setStoryOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef(false);

  const load = useCallback(async (key?: string, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (key) qs.set("key", key);
      if (previewRef.current) qs.set("preview", "1");
      const res = await fetch(`/api/user/semester-review?${qs}`);
      if (!res.ok) return null;
      const data = (await res.json()) as ApiResponse;
      setSemesters(data.semesters);
      setReview(data.review);
      setPreview(data.preview);
      return data;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    previewRef.current = params.has("reviewPreview");
    const wanted = params.get("review") ?? undefined;
    // Data fetch on mount; state is only set after the awaited response.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(wanted, false).then((data) => {
      if (wanted && data?.review?.semester.key === wanted) setStoryOpen(true);
    });
  }, [load]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (semesters.length === 0) return null;

  const current = review?.semester ?? semesters[0];
  const others = semesters.filter((s) => s.key !== current.key);
  const empty = !loading && review !== null && review.slides.length === 0;

  async function pick(key: string) {
    setMenuOpen(false);
    await load(key);
  }

  return (
    <section className="mt-8" aria-label="Semester in Review">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink to-[#1d5a41] p-5 text-paper shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-gold-bright">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Semester in Review
            </p>
            <h2 className="mt-2 font-display text-2xl">{current.label}</h2>
            {preview && !current.ended ? (
              <p className="mt-1 text-xs text-paper/60">Admin preview: semester still in progress, nothing is saved.</p>
            ) : null}
          </div>
          {others.length > 0 ? (
            <div ref={menuRef} className="relative shrink-0">
              <button
                type="button"
                aria-label="Other semesters"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="grid h-9 w-9 place-items-center rounded-full bg-paper/10 hover:bg-paper/20 focus-visible:outline-2 focus-visible:outline-gold"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl bg-paper py-1 text-sm text-ink shadow-lg ring-1 ring-ink/10"
                >
                  <p className="px-3 py-1.5 text-xs uppercase tracking-wide text-ink/40">Other semesters</p>
                  {others.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      role="menuitem"
                      onClick={() => void pick(s.key)}
                      className="block w-full px-3 py-2 text-left hover:bg-paper-dim"
                    >
                      {s.label}
                      {!s.ended ? <span className="ml-2 text-xs text-ink/40">(in progress)</span> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-paper/60">Loading your semester...</p>
        ) : empty ? (
          <p className="mt-4 text-sm text-paper/75">
            Nothing to show for this semester yet. Join an event, post in Chat, or rate a professor, and your story will
            fill up next time.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setStoryOpen(true)}
            className="mt-4 rounded-full bg-gold-bright px-5 py-2.5 text-sm font-semibold text-ink hover:opacity-90"
          >
            View your semester
          </button>
        )}
      </div>

      {storyOpen && review && review.slides.length > 0 ? (
        <SemesterStory review={review} onClose={() => setStoryOpen(false)} />
      ) : null}
    </section>
  );
}
