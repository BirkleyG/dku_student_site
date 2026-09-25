"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { CircleAlert, Search, Smile, Star, Trash2, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { CatalogPicker } from "@/components/courses/CatalogPicker";
import { DKU_DEPARTMENTS } from "@/lib/departments";
import type { CatalogCourse } from "@/lib/course-catalog";

type ApiReview = {
  id: string;
  authorId: string;
  gradingRating: number;
  funRating: number;
  teachingRating: number;
  comment: string | null;
  createdAt: string;
  author: { firstName: string; lastName: string };
  course: { id: string; code: string; title: string } | null;
};

type CourseOption = { id: string; code: string; title: string };

export function ReviewsPanel({
  professorId,
  currentUserId,
  isAdmin,
  canReview,
  initialReviews,
}: {
  professorId: string;
  currentUserId: string | null;
  isAdmin: boolean;
  canReview: boolean;
  initialReviews: ApiReview[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [grading, setGrading] = useState(3);
  const [fun, setFun] = useState(3);
  const [teaching, setTeaching] = useState(3);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Course link: search the site's courses, or add one on the spot (which
  // also links it to this professor) — reviews aren't limited to courses
  // already known to be taught by them.
  const [courseQuery, setCourseQuery] = useState("");
  const [courseMatches, setCourseMatches] = useState<CourseOption[] | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseOption | null>(null);
  const [addingCourse, setAddingCourse] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [newDepartment, setNewDepartment] = useState(DKU_DEPARTMENTS[0]);
  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [courseError, setCourseError] = useState<string | null>(null);
  const [linkingCourse, setLinkingCourse] = useState(false);

  // The search box (for courses already on the site) only shows while
  // addingCourse is false — that flag gates the separate "add a new course"
  // sub-form instead.
  useEffect(() => {
    if (addingCourse) return;
    const query = courseQuery.trim();
    let cancelled = false;
    const handle = setTimeout(() => {
      if (query.length < 1) {
        setCourseMatches(null);
        return;
      }
      fetch(`/api/courses?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) setCourseMatches((data.courses ?? []).map((c: CourseOption) => ({ id: c.id, code: c.code, title: c.title })));
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [courseQuery, addingCourse]);

  const alreadyReviewed = useMemo(
    () => reviews.some((r) => r.authorId === currentUserId && (r.course?.id ?? "") === (selectedCourse?.id ?? "")),
    [reviews, currentUserId, selectedCourse],
  );

  const resetCoursePicker = () => {
    setAddingCourse(false);
    setManualEntry(false);
    setCourseQuery("");
    setCourseMatches(null);
    setNewCode("");
    setNewTitle("");
    setCourseError(null);
  };

  const linkNewCourse = async (input: { department: string; code: string; title: string }) => {
    setCourseError(null);
    setLinkingCourse(true);
    try {
      let courseId: string;
      const createRes = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department: input.department, code: input.code, title: input.title }),
      });
      if (createRes.status === 409) {
        // Already exists on the site — look it up instead of failing.
        const search = await fetch(`/api/courses?q=${encodeURIComponent(input.code)}`).then((r) => r.json());
        const found = (search.courses ?? []).find(
          (c: CourseOption) => c.code.toLowerCase() === input.code.trim().toUpperCase().toLowerCase(),
        );
        if (!found) {
          setCourseError("That course code already exists but couldn't be found. Try searching for it instead.");
          return;
        }
        courseId = found.id;
      } else if (!createRes.ok) {
        const body = await createRes.json().catch(() => ({}));
        setCourseError(body.error ?? "Couldn't add that course.");
        return;
      } else {
        const { course } = await createRes.json();
        courseId = course.id;
      }

      // Link it to this professor too, so it shows up under "Courses taught".
      await fetch(`/api/courses/${courseId}/offerings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professorId }),
      }).catch(() => {});

      const courseRes = await fetch(`/api/courses/${courseId}`).then((r) => r.json());
      setSelectedCourse({ id: courseId, code: courseRes.course?.code ?? input.code, title: courseRes.course?.title ?? input.title });
      resetCoursePicker();
    } finally {
      setLinkingCourse(false);
    }
  };

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    const res = await fetch(`/api/professors/${professorId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: selectedCourse?.id ?? "",
        gradingRating: grading,
        teachingRating: teaching,
        funRating: fun,
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

  const averages = useMemo(() => {
    if (!reviews.length) return null;
    const n = reviews.length;
    return {
      grading: reviews.reduce((s, r) => s + r.gradingRating, 0) / n,
      teaching: reviews.reduce((s, r) => s + r.teachingRating, 0) / n,
      fun: reviews.reduce((s, r) => s + r.funRating, 0) / n,
    };
  }, [reviews]);

  return (
    <div className="mt-10">
      <h2 className="font-display text-xl">Ratings</h2>

      {averages ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <RatingStat icon={CircleAlert} iconClass="text-danger" label="Grading & fairness" value={averages.grading} />
          <RatingStat icon={Star} iconClass="fill-gold-bright text-gold-bright" label="Teaching quality" value={averages.teaching} />
          <RatingStat icon={Smile} iconClass="text-sprout-deep" label="How fun" value={averages.fun} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink/40">No ratings yet — be the first to rate.</p>
      )}

      <div className="mt-6 space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl bg-paper-dim p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs text-ink/50">
                <span className="flex items-center gap-1">
                  <CircleAlert className="h-3.5 w-3.5 text-danger" /> {r.gradingRating}/5
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-gold-bright text-gold-bright" /> {r.teachingRating}/5
                </span>
                <span className="flex items-center gap-1">
                  <Smile className="h-3.5 w-3.5 text-sprout-deep" /> {r.funRating}/5
                </span>
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

            <div>
              <span className="mb-1.5 block text-xs text-ink/60">Which class? (optional)</span>
              {selectedCourse ? (
                <div className="flex items-center justify-between rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">
                  <span className="text-sm text-ink">
                    {selectedCourse.code} — {selectedCourse.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCourse(null)}
                    className="focus-ring text-ink/45 hover:text-ink"
                    aria-label="Clear course"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : addingCourse ? (
                <div className="space-y-3 rounded-xl border border-ink/10 bg-paper p-3">
                  {!manualEntry ? (
                    <>
                      <CatalogPicker
                        onPick={(c: CatalogCourse) => {
                          linkNewCourse({ department: c.department, code: c.code, title: c.title });
                        }}
                      />
                      <p className="text-xs text-ink/40">Picking one from the catalog adds it to the site and links it to this professor.</p>
                      <button
                        type="button"
                        onClick={() => setManualEntry(true)}
                        className="focus-ring text-xs text-ink/50 underline decoration-ink/25 underline-offset-2 hover:text-ink"
                      >
                        Not in the catalog — enter it by hand
                      </button>
                    </>
                  ) : (
                    <>
                      <select
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink focus:border-gold"
                      >
                        {DKU_DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <Field label="Course code" placeholder="COMPSCI 201" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
                      <Field label="Title" placeholder="Data Structures" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                      <Button
                        type="button"
                        onClick={() => linkNewCourse({ department: newDepartment, code: newCode, title: newTitle })}
                        disabled={linkingCourse || !newCode.trim() || !newTitle.trim()}
                        className="w-full"
                      >
                        {linkingCourse ? "Adding…" : "Add & link this course"}
                      </Button>
                    </>
                  )}
                  {courseError ? <p className="text-sm text-danger">{courseError}</p> : null}
                  <button
                    type="button"
                    onClick={resetCoursePicker}
                    className="focus-ring text-xs text-ink/50 underline decoration-ink/25 underline-offset-2 hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
                  <input
                    value={courseQuery}
                    onChange={(e) => setCourseQuery(e.target.value)}
                    placeholder="Search for the class you took — or leave blank for a general rating"
                    className="focus-ring w-full rounded-xl border border-ink/15 bg-paper py-3 pl-11 pr-4 text-ink placeholder:text-ink/30 focus:border-gold"
                  />
                  {courseMatches ? (
                    <div className="mt-1.5 overflow-hidden rounded-xl border border-ink/10 bg-paper shadow-sm">
                      {courseMatches.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => setAddingCourse(true)}
                          className="focus-ring block w-full px-4 py-3 text-left text-sm text-ink/60 hover:bg-paper-dim hover:text-ink"
                        >
                          No matches — add the course you took
                        </button>
                      ) : (
                        courseMatches.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCourse(c);
                              setCourseMatches(null);
                              setCourseQuery("");
                            }}
                            className="focus-ring flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-paper-dim"
                          >
                            <span className="text-ink">{c.code}</span>
                            <span className="truncate text-xs text-ink/40">{c.title}</span>
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                  {courseQuery.trim().length === 0 ? (
                    <button
                      type="button"
                      onClick={() => setAddingCourse(true)}
                      className="focus-ring mt-1.5 text-xs text-ink/50 underline decoration-ink/25 underline-offset-2 hover:text-ink"
                    >
                      Class not on the site yet? Add it
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            <IconRatingPicker
              icon={CircleAlert}
              activeClass="text-danger"
              label="Grading — how tough or fair? (more marks = tougher)"
              value={grading}
              onChange={setGrading}
            />
            <IconRatingPicker icon={Star} activeClass="fill-gold-bright text-gold-bright" label="Teaching quality" value={teaching} onChange={setTeaching} />
            <IconRatingPicker icon={Smile} activeClass="text-sprout-deep" label="How fun was it?" value={fun} onChange={setFun} />

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

function RatingStat({
  icon: Icon,
  iconClass,
  label,
  value,
}: {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-paper-dim p-4 text-center">
      <Icon className={`mx-auto h-5 w-5 ${iconClass}`} />
      <p className="mt-1 text-2xl font-display">{value.toFixed(1)}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.1em] text-ink/45">{label}</p>
    </div>
  );
}

function IconRatingPicker({
  icon: Icon,
  activeClass,
  label,
  value,
  onChange,
}: {
  icon: LucideIcon;
  activeClass: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs text-ink/60">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} className="focus-ring p-0.5" aria-label={`${n} out of 5`}>
            <Icon className={`h-5 w-5 ${n <= value ? activeClass : "text-ink/20"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
