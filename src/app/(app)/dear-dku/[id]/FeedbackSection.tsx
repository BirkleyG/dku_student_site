"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";

type ApiComment = {
  id: string;
  body: string;
  authorId: string;
  author: { firstName: string; lastName: string };
  createdAt: string;
};

export function FeedbackSection({
  postId,
  isGoogleDoc,
  currentUserId,
  isAdmin,
  canComment,
  initialComments,
}: {
  postId: string;
  isGoogleDoc: boolean;
  currentUserId: string | null;
  isAdmin: boolean;
  canComment: boolean;
  initialComments: ApiComment[];
}) {
  const t = useT("dearDku");
  const [comments, setComments] = useState(initialComments);

  return (
    <div className="mt-10">
      <h2 className="font-display text-xl">
        {comments.length === 1
          ? t("feedbackCountOne", { count: comments.length })
          : t("feedbackCountOther", { count: comments.length })}
      </h2>
      {isGoogleDoc ? <p className="mt-1 text-sm text-ink/45">{t("gdocFeedbackHint")}</p> : null}

      {comments.length === 0 ? (
        <p className="mt-4 text-sm text-ink/40">{t("nothingHereAddFeedback")}</p>
      ) : (
        <StaggerGroup className="mt-4 space-y-3">
          {comments.map((comment) => (
            <StaggerItem key={comment.id}>
              <CommentCard
                postId={postId}
                comment={comment}
                canDelete={isAdmin || comment.authorId === currentUserId}
                onDeleted={() => setComments((prev) => prev.filter((c) => c.id !== comment.id))}
              />
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}

      {canComment ? (
        <AddCommentForm postId={postId} onAdded={(comment) => setComments((prev) => [...prev, comment])} />
      ) : (
        <p className="mt-6 text-sm text-ink/40">{t("logInToLeaveFeedback")}</p>
      )}
    </div>
  );
}

function CommentCard({
  postId,
  comment,
  canDelete,
  onDeleted,
}: {
  postId: string;
  comment: ApiComment;
  canDelete: boolean;
  onDeleted: () => void;
}) {
  const t = useT("dearDku");
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    if (!window.confirm(t("confirmRemoveFeedback"))) return;
    setDeleting(true);
    const res = await fetch(`/api/dear-dku/${postId}/comments/${comment.id}`, { method: "DELETE" });
    if (res.ok) onDeleted();
    else setDeleting(false);
  };

  return (
    <Card>
      <p className="whitespace-pre-wrap text-sm text-ink/80">{comment.body}</p>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-ink/40">
          {comment.author.firstName} {comment.author.lastName}
        </p>
        {canDelete ? (
          <button
            onClick={remove}
            disabled={deleting}
            className="focus-ring inline-flex items-center gap-1 text-xs text-ink/35 transition-colors hover:text-danger disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? t("removing") : t("remove")}
          </button>
        ) : null}
      </div>
    </Card>
  );
}

function AddCommentForm({ postId, onAdded }: { postId: string; onAdded: (comment: ApiComment) => void }) {
  const t = useT("dearDku");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!body.trim()) {
      setError(t("sayABitMore"));
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/dear-dku/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      setError(errBody.error ?? t("couldntAddFeedback"));
      setSubmitting(false);
      return;
    }
    const { comment } = await res.json();
    onAdded(comment);
    setBody("");
    setSubmitting(false);
  };

  return (
    <div className="mt-6 rounded-2xl border border-ink/10 bg-paper-dim p-5">
      <h3 className="font-display text-xl">{t("giveFeedbackTitle")}</h3>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder={t("feedbackPlaceholder")}
        className="focus-ring mt-3 w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
      />
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <Button onClick={submit} disabled={submitting} className="mt-4">
        {submitting ? t("submittingFeedback") : t("submitFeedback")}
      </Button>
    </div>
  );
}
