"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SemesterPicker } from "@/components/ui/SemesterPicker";
import { DKU_DEPARTMENTS } from "@/lib/departments";

type Offering = {
  id: string;
  semester: string;
  professor: { id: string; firstName: string; lastName: string };
};

type ProfessorOption = { id: string; firstName: string; lastName: string; department: string };

export function OfferingsPanel({
  courseId,
  courseDepartment,
  canEdit,
  initialOfferings,
}: {
  courseId: string;
  courseDepartment: string;
  canEdit: boolean;
  initialOfferings: Offering[];
}) {
  const [offerings, setOfferings] = useState(initialOfferings);
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const [matches, setMatches] = useState<ProfessorOption[] | null>(null);
  const [selected, setSelected] = useState<ProfessorOption | null>(null);
  const [addingNewProfessor, setAddingNewProfessor] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newDepartment, setNewDepartment] = useState(courseDepartment);
  const [newEmail, setNewEmail] = useState("");
  const [semester, setSemester] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adding || addingNewProfessor) return;
    const query = q.trim();
    let cancelled = false;
    const handle = setTimeout(() => {
      if (query.length < 1) {
        setMatches(null);
        return;
      }
      fetch(`/api/professors?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) setMatches(data.professors ?? []);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [q, adding, addingNewProfessor]);

  const reset = () => {
    setAdding(false);
    setAddingNewProfessor(false);
    setQ("");
    setMatches(null);
    setSelected(null);
    setNewFirstName("");
    setNewLastName("");
    setNewEmail("");
    setSemester("");
    setError(null);
  };

  const submit = async () => {
    setError(null);
    if (!addingNewProfessor && !selected) {
      setError("Pick a professor, or add a new one");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/courses/${courseId}/offerings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        professorId: addingNewProfessor ? "" : selected?.id,
        newProfessorFirstName: addingNewProfessor ? newFirstName : "",
        newProfessorLastName: addingNewProfessor ? newLastName : "",
        newProfessorDepartment: addingNewProfessor ? newDepartment : undefined,
        newProfessorEmail: addingNewProfessor ? newEmail : undefined,
        semester,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't link that professor.");
      setSubmitting(false);
      return;
    }
    const { offering } = await res.json();
    setOfferings((prev) => [...prev, offering]);
    setSubmitting(false);
    reset();
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        {offerings.map((o) => (
          <Link
            key={o.id}
            href={`/professors/${o.professor.id}`}
            className="focus-ring rounded-full border border-ink/15 px-3 py-1.5 text-xs text-ink/70 transition-colors hover:border-gold hover:text-ink"
          >
            {o.professor.firstName} {o.professor.lastName} · {o.semester}
          </Link>
        ))}
        {offerings.length === 0 ? <p className="text-sm text-ink/40">No professor linked yet.</p> : null}
        {canEdit && !adding ? (
          <button
            onClick={() => setAdding(true)}
            className="focus-ring inline-flex items-center gap-1 rounded-full border border-dashed border-ink/20 px-3 py-1.5 text-xs text-ink/50 transition-colors hover:border-ink/40 hover:text-ink"
          >
            <Plus className="h-3.5 w-3.5" /> Link a professor
          </button>
        ) : null}
      </div>

      {adding ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-ink/10 bg-paper-dim/60 p-4">
          {!addingNewProfessor ? (
            <>
              {selected ? (
                <div className="flex items-center justify-between rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">
                  <span className="text-sm text-ink">
                    {selected.firstName} {selected.lastName} — {selected.department}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="focus-ring text-ink/45 hover:text-ink"
                    aria-label="Clear selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search professors by name…"
                    className="focus-ring w-full rounded-xl border border-ink/15 bg-paper py-3 pl-11 pr-4 text-ink placeholder:text-ink/30 focus:border-gold"
                  />
                  {matches ? (
                    <div className="mt-1.5 overflow-hidden rounded-xl border border-ink/10 bg-paper shadow-sm">
                      {matches.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-ink/40">No matches — add them below.</p>
                      ) : (
                        matches.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelected(p);
                              setMatches(null);
                            }}
                            className="focus-ring flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-paper-dim"
                          >
                            <span className="text-ink">
                              {p.firstName} {p.lastName}
                            </span>
                            <span className="text-xs text-ink/40">{p.department}</span>
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setAddingNewProfessor(true);
                  setSelected(null);
                  setMatches(null);
                }}
                className="focus-ring text-xs text-ink/50 underline decoration-ink/25 underline-offset-2 hover:text-ink"
              >
                Can&apos;t find them — add a new professor
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} />
                <Field label="Last name" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} />
              </div>
              <select
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="focus-ring w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-ink focus:border-gold"
              >
                {DKU_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <Field
                label="Email (optional)"
                placeholder="name@dukekunshan.edu.cn"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setAddingNewProfessor(false)}
                className="focus-ring text-xs text-ink/50 underline decoration-ink/25 underline-offset-2 hover:text-ink"
              >
                Search existing professors instead
              </button>
            </div>
          )}

          <div>
            <span className="mb-1.5 block text-xs text-ink/60">Semester (optional)</span>
            <SemesterPicker value={semester} onChange={setSemester} />
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex gap-2">
            <Button onClick={submit} disabled={submitting}>
              {submitting ? "Linking…" : "Link professor"}
            </Button>
            <Button variant="ghost" onClick={reset} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
