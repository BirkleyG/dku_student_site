"use client";

import { useMemo, useState } from "react";
import { ChevronUp, ChevronDown, MapPin, Trash2 } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";

type ApiRecommendation = {
  id: string;
  placeName: string;
  location: string | null;
  description: string;
  authorId: string;
  author: { firstName: string; lastName: string };
  votes: { userId: string; value: number }[];
};

function score(rec: ApiRecommendation) {
  return rec.votes.reduce((sum, v) => sum + v.value, 0);
}

function isLink(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

export function RecommendationList({
  topicId,
  requireLocation,
  currentUserId,
  isAdmin,
  canAdd,
  initialRecommendations,
}: {
  topicId: string;
  requireLocation: boolean;
  currentUserId: string | null;
  isAdmin: boolean;
  canAdd: boolean;
  initialRecommendations: ApiRecommendation[];
}) {
  const t = useT("wisdom");
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const sorted = useMemo(() => [...recommendations].sort((a, b) => score(b) - score(a)), [recommendations]);

  return (
    <div className="mt-8">
      <h2 className="font-display text-xl">
        {recommendations.length === 1
          ? t("recommendationCountOne", { count: recommendations.length })
          : t("recommendationCountOther", { count: recommendations.length })}
      </h2>

      {sorted.length === 0 ? (
        <p className="mt-4 text-sm text-ink/40">{t("nothingHereAddFirst")}</p>
      ) : (
        <StaggerGroup className="mt-4 space-y-4">
          {sorted.map((rec) => (
            <StaggerItem key={rec.id}>
              <RecommendationCard
                topicId={topicId}
                rec={rec}
                currentUserId={currentUserId}
                canDelete={isAdmin || rec.authorId === currentUserId}
                onDeleted={() => setRecommendations((prev) => prev.filter((r) => r.id !== rec.id))}
              />
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}

      {canAdd ? (
        <AddRecommendationForm
          topicId={topicId}
          requireLocation={requireLocation}
          onAdded={(rec) => setRecommendations((prev) => [...prev, rec])}
        />
      ) : (
        <p className="mt-6 text-sm text-ink/40">{t("logInToAddRecommendation")}</p>
      )}
    </div>
  );
}

function RecommendationCard({
  topicId,
  rec,
  currentUserId,
  canDelete,
  onDeleted,
}: {
  topicId: string;
  rec: ApiRecommendation;
  currentUserId: string | null;
  canDelete: boolean;
  onDeleted: () => void;
}) {
  const t = useT("wisdom");
  const [votes, setVotes] = useState(rec.votes);
  const [deleting, setDeleting] = useState(false);
  const currentScore = votes.reduce((sum, v) => sum + v.value, 0);
  const myVote = votes.find((v) => v.userId === currentUserId)?.value ?? 0;

  const vote = async (value: 1 | -1) => {
    if (!currentUserId) return;
    const res = await fetch(`/api/wisdom/${topicId}/recommendations/${rec.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    }).catch(() => null);
    if (!res || !res.ok) return;
    const data = await res.json();
    setVotes((prev) => {
      const rest = prev.filter((v) => v.userId !== currentUserId);
      return data.myVote === 0 ? rest : [...rest, { userId: currentUserId, value: data.myVote }];
    });
  };

  const remove = async () => {
    if (!window.confirm(t("confirmRemoveRecommendation"))) return;
    setDeleting(true);
    const res = await fetch(`/api/wisdom/${topicId}/recommendations/${rec.id}`, { method: "DELETE" });
    if (res.ok) onDeleted();
    else setDeleting(false);
  };

  return (
    <Card className="flex gap-4">
      <div className="flex shrink-0 flex-col items-center gap-1 pt-1">
        <button
          onClick={() => vote(1)}
          disabled={!currentUserId}
          className={`focus-ring rounded-full p-1 transition-colors disabled:opacity-30 ${
            myVote === 1 ? "text-gold-bright" : "text-ink/40 hover:text-ink"
          }`}
          aria-label={t("upvote")}
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-ink">{currentScore}</span>
        <button
          onClick={() => vote(-1)}
          disabled={!currentUserId}
          className={`focus-ring rounded-full p-1 transition-colors disabled:opacity-30 ${
            myVote === -1 ? "text-danger" : "text-ink/40 hover:text-ink"
          }`}
          aria-label={t("downvote")}
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-display text-2xl">{rec.placeName}</h3>
        {rec.location ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-ink/45">
            <MapPin className="h-3 w-3 shrink-0" />
            {isLink(rec.location) ? (
              <a href={rec.location} target="_blank" rel="noopener noreferrer" className="underline decoration-ink/30 underline-offset-2 hover:text-ink">
                {t("openInAMap")}
              </a>
            ) : (
              <span className="truncate">{rec.location}</span>
            )}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-ink/65">{rec.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-ink/40">
            {rec.author.firstName} {rec.author.lastName}
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
      </div>
    </Card>
  );
}

function AddRecommendationForm({
  topicId,
  requireLocation,
  onAdded,
}: {
  topicId: string;
  requireLocation: boolean;
  onAdded: (rec: ApiRecommendation) => void;
}) {
  const t = useT("wisdom");
  const [placeName, setPlaceName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!placeName.trim() || !description.trim()) {
      setError(t("giveNameAndReason"));
      return;
    }
    if (requireLocation && !location.trim()) {
      setError(t("locationRequiredError"));
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/wisdom/${topicId}/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeName, location, description }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? t("couldntAdd"));
      setSubmitting(false);
      return;
    }
    const { recommendation } = await res.json();
    onAdded(recommendation);
    setPlaceName("");
    setLocation("");
    setDescription("");
    setSubmitting(false);
  };

  return (
    <div className="mt-8 rounded-2xl border border-ink/10 bg-paper-dim p-5">
      <h3 className="font-display text-xl">{t("addRecommendationTitle")}</h3>
      <div className="mt-4 space-y-3">
        <input
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          placeholder={t("placeNamePlaceholder")}
          className="focus-ring w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={requireLocation ? t("locationPlaceholderRequired") : t("locationPlaceholderOptional")}
          className="focus-ring w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder={t("whyBestPlaceholder")}
          className="focus-ring w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
        />
      </div>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <Button onClick={submit} disabled={submitting} className="mt-4">
        {submitting ? t("adding") : t("addRecommendation")}
      </Button>
    </div>
  );
}
