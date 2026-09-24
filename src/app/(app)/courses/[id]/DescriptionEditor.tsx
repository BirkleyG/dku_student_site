"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function DescriptionEditor({
  courseId,
  initialDescription,
  canEdit,
}: {
  courseId: string;
  initialDescription: string | null;
  canEdit: boolean;
}) {
  const [description, setDescription] = useState(initialDescription);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialDescription ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: draft }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't save that.");
      setSubmitting(false);
      return;
    }
    setDescription(draft || null);
    setEditing(false);
    setSubmitting(false);
  };

  if (editing) {
    return (
      <div className="mt-6 space-y-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          placeholder="What's this course actually like?"
          className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex gap-2">
          <Button onClick={save} disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setDraft(description ?? "");
              setEditing(false);
              setError(null);
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {description ? (
        <p className="leading-relaxed text-ink/80">{description}</p>
      ) : canEdit ? (
        <p className="text-sm text-ink/40">No description yet.</p>
      ) : null}
      {canEdit ? (
        <button
          onClick={() => setEditing(true)}
          className="focus-ring mt-2 inline-flex items-center gap-1.5 text-xs text-ink/45 transition-colors hover:text-ink"
        >
          <Pencil className="h-3.5 w-3.5" /> {description ? "Edit description" : "Add a description"}
        </button>
      ) : null}
    </div>
  );
}
