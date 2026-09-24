"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
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
  const [professors, setProfessors] = useState<ProfessorOption[] | null>(null);
  const [addingNewProfessor, setAddingNewProfessor] = useState(false);
  const [professorId, setProfessorId] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newDepartment, setNewDepartment] = useState(courseDepartment);
  const [semester, setSemester] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adding || professors !== null) return;
    fetch("/api/professors")
      .then((r) => r.json())
      .then((data) => setProfessors(data.professors ?? []));
  }, [adding, professors]);

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    const res = await fetch(`/api/courses/${courseId}/offerings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        professorId: addingNewProfessor ? "" : professorId,
        newProfessorFirstName: addingNewProfessor ? newFirstName : "",
        newProfessorLastName: addingNewProfessor ? newLastName : "",
        newProfessorDepartment: addingNewProfessor ? newDepartment : undefined,
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
    setAdding(false);
    setProfessorId("");
    setNewFirstName("");
    setNewLastName("");
    setSemester("");
    setSubmitting(false);
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
          {professors && professors.length > 0 && !addingNewProfessor ? (
            <>
              <select
                value={professorId}
                onChange={(e) => setProfessorId(e.target.value)}
                className="focus-ring w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-ink focus:border-gold"
              >
                <option value="">Pick a professor…</option>
                {professors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} — {p.department}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAddingNewProfessor(true)}
                className="focus-ring text-xs text-ink/50 underline decoration-ink/25 underline-offset-2 hover:text-ink"
              >
                Their name isn&apos;t listed — add a new professor
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
              {professors && professors.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setAddingNewProfessor(false)}
                  className="focus-ring text-xs text-ink/50 underline decoration-ink/25 underline-offset-2 hover:text-ink"
                >
                  Pick an existing professor instead
                </button>
              ) : null}
            </div>
          )}

          <Field label="Semester (optional)" placeholder="Fall 2025" value={semester} onChange={(e) => setSemester(e.target.value)} />

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex gap-2">
            <Button onClick={submit} disabled={submitting}>
              {submitting ? "Linking…" : "Link professor"}
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
