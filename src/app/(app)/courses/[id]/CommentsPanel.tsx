"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";

type ApiComment = {
  id: string;
  body: string;
  createdAt: string;
  author: { firstName: string; lastName: string };
};

export function CommentsPanel({
  courseId,
  canComment,
  initialComments,
}: {
  courseId: string;
  canComment: boolean;
  initialComments: ApiComment[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!value.trim()) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/courses/${courseId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: value }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't post that comment.");
      setSubmitting(false);
      return;
    }
    const { comment } = await res.json();
    setComments((c) => [...c, comment]);
    setValue("");
    setSubmitting(false);
  };

  return (
    <div className="mt-10">
      <h2 className="font-display text-xl">
        {comments.length} {comments.length === 1 ? "comment" : "comments"}
      </h2>

      <div className="mt-4 space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="rounded-2xl bg-paper-dim p-4">
            <p className="text-sm text-ink/85">{c.body}</p>
            <p className="mt-2 text-xs text-ink/40">
              {c.author.firstName} {c.author.lastName} · {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
            </p>
          </div>
        ))}
      </div>

      {canComment ? (
        <div className="mt-5 flex gap-2">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Anything future students should know?"
            rows={2}
            className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
          />
          <Button onClick={submit} disabled={submitting} className="shrink-0">
            {submitting ? "…" : "Post"}
          </Button>
        </div>
      ) : (
        <p className="mt-5 text-sm text-ink/40">Log in to comment.</p>
      )}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
