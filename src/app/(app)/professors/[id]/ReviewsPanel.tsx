"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

type ApiReview = {
  id: string;
  authorId: string;
  gradingRating: number;
  difficultyRating: number;
  teachingRating: number;
  comment: string | null;
  createdAt: string;
  author: { firstName: string; lastName: string };
  course: { id: string; code: string; title: string } | null;
};

type CourseOption = { id: string; code: string; title: string };

export function ReviewsPanel({
  professorId,
  courses,
  currentUserId,
  isAdmin,
  canReview,
  initialReviews,
}: {
  professorId: string;
  courses: CourseOption[];
  currentUserId: string | null;
  isAdmin: boolean;
  canReview: boolean;
  initialReviews: ApiReview[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [grading, setGrading] = useState(3);
  const [difficulty, setDifficulty] = useState(3);
  const [teaching, setTeaching] = useState(3);
  const [courseId, setCourseId] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alreadyReviewed = useMemo(
    () => reviews.some((r) => r.authorId === currentUserId && (r.course?.id ?? "") === courseId),
    [reviews, currentUserId, courseId]
  );

  const averages = useMemo(() => {
    if (!reviews.length) return null;
    const n = reviews.length;
    return {
      grading: reviews.reduce((s, r) => s + r.gradingRating, 0) / n,
      difficulty: reviews.reduce((s, r) => s + r.difficultyRating, 0) / n,
      teaching: reviews.reduce((s, r) => s + r.teachingRating, 0) / n,
    };
  }, [reviews]);

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    const res = await fetch(`/api/professors/${professorId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        gradingRating: grading,
        difficultyRating: difficulty,
        teachingRating: teaching,
        comment,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't submit that rating.");
      setSubmitting(false);
      return;
    }
    const { review } = await res.json();
    setReviews((prev) => [review, ...prev]);
    setComment("");
    setSubmitting(false);
  };

  const remove = async (id: string) => {
    if (!window.confirm("Remove this rating?")) return;
    const res = await fetch(`/api/professors/${professorId}/reviews/${id}`, { method: "DELETE" });
    if (res.ok) setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="mt-10">
      <h2 className="font-display text-xl">Ratings</h2>

      {averages ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <RatingStat label="Grading" value={averages.grading} />
          <RatingStat label="Difficulty" value={averages.difficulty} />
          <RatingStat label="Teaching" value={averages.teaching} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink/40">No ratings yet — be the first to rate.</p>
      )}

      <div className="mt-6 space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl bg-paper-dim p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs text-ink/50">
                <span>Grading {r.gradingRating}/5</span>
                <span>Difficulty {r.difficultyRating}/5</span>
                <span>Teaching {r.teachingRating}/5</span>
                {r.course ? <span className="rounded-full bg-sprout/25 px-2 py-0.5 text-sprout-deep">{r.course.code}</span> : null}
              </div>
              {isAdmin || r.authorId === currentUserId ? (
                <button
                  onClick={() => remove(r.id)}
                  className="focus-ring shrink-0 text-ink/30 transition-colors hover:text-danger"
                  aria-label="Remove rating"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            {r.comment ? <p className="mt-2 text-sm text-ink/85">{r.comment}</p> : null}
            <p className="mt-2 text-xs text-ink/40">
              {r.author.firstName} {r.author.lastName.charAt(0)}. · {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
            </p>
          </div>
        ))}
      </div>

      {canReview ? (
        alreadyReviewed ? (
          <p className="mt-6 text-sm text-ink/40">You&apos;ve already rated this professor for that course.</p>
        ) : (
          <div className="mt-6 space-y-4 rounded-2xl border border-ink/10 bg-paper-dim/60 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-ink/60">Rate this professor</p>

            {courses.length ? (
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="focus-ring w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-ink focus:border-gold"
              >
                <option value="">General (not course-specific)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
            ) : null}

            <StarPicker label="Grading (generous → harsh)" value={grading} onChange={setGrading} />
            <StarPicker label="Difficulty (easy → hard)" value={difficulty} onChange={setDifficulty} />
            <StarPicker label="Teaching quality" value={teaching} onChange={setTeaching} />

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How they grade, how the class is run, tips for taking their course…"
              rows={3}
              className="focus-ring w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
            />

            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button onClick={submit} disabled={submitting} className="w-full">
              {submitting ? "Submitting…" : "Submit rating"}
            </Button>
          </div>
        )
      ) : (
        <p className="mt-6 text-sm text-ink/40">Log in to rate.</p>
      )}
    </div>
  );
}

function RatingStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-paper-dim p-4 text-center">
      <p className="text-2xl font-display">{value.toFixed(1)}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.1em] text-ink/45">{label}</p>
    </div>
  );
}

function StarPicker({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs text-ink/60">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="focus-ring p-0.5"
            aria-label={`${n} out of 5`}
          >
            <Star className={`h-5 w-5 ${n <= value ? "fill-gold-bright text-gold-bright" : "text-ink/20"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
