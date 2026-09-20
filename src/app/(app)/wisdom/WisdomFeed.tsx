"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronUp, ChevronDown, MapPin, Trash2 } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { wisdomCategories, wisdomCategoryLabels } from "@/lib/wisdom-validation";

type ApiPost = {
  id: string;
  title: string;
  category: (typeof wisdomCategories)[number];
  location: string | null;
  body: string;
  authorId: string;
  author: { firstName: string; lastName: string };
  votes: { userId: string; value: number }[];
};

export function WisdomFeed({ currentUserId, isAdmin = false }: { currentUserId: string | null; isAdmin?: boolean }) {
  const [posts, setPosts] = useState<ApiPost[] | null>(null);
  const [category, setCategory] = useState<(typeof wisdomCategories)[number] | "ALL">("ALL");

  useEffect(() => {
    let cancelled = false;
    const qs = category === "ALL" ? "" : `?category=${category}`;
    fetch(`/api/wisdom${qs}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setPosts(data.posts ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  const sorted = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort((a, b) => score(b) - score(a));
  }, [posts]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={category === "ALL"} onClick={() => setCategory("ALL")}>
          All
        </FilterChip>
        {wisdomCategories.map((c) => (
          <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>
            {wisdomCategoryLabels[c]}
          </FilterChip>
        ))}
      </div>

      {posts === null ? (
        <p className="mt-10 text-sm text-ink/40">Loading wisdom…</p>
      ) : sorted.length === 0 ? (
        <p className="mt-10 text-ink/50">Nothing here yet. Add the first recommendation.</p>
      ) : (
        <StaggerGroup className="mt-8 space-y-4">
          {sorted.map((post) => (
            <StaggerItem key={post.id}>
              <WisdomCard
                post={post}
                currentUserId={currentUserId}
                canDelete={isAdmin || post.authorId === currentUserId}
                onDeleted={() => setPosts((prev) => (prev ? prev.filter((p) => p.id !== post.id) : prev))}
              />
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}

function score(post: ApiPost) {
  return post.votes.reduce((sum, v) => sum + v.value, 0);
}

function WisdomCard({
  post,
  currentUserId,
  canDelete,
  onDeleted,
}: {
  post: ApiPost;
  currentUserId: string | null;
  canDelete: boolean;
  onDeleted: () => void;
}) {
  const [votes, setVotes] = useState(post.votes);
  const [deleting, setDeleting] = useState(false);
  const currentScore = votes.reduce((sum, v) => sum + v.value, 0);
  const myVote = votes.find((v) => v.userId === currentUserId)?.value ?? 0;

  const vote = async (value: 1 | -1) => {
    if (!currentUserId) return;
    const res = await fetch(`/api/wisdom/${post.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setVotes((prev) => {
      const rest = prev.filter((v) => v.userId !== currentUserId);
      return data.myVote === 0 ? rest : [...rest, { userId: currentUserId, value: data.myVote }];
    });
  };

  const remove = async () => {
    if (!window.confirm("Remove this recommendation?")) return;
    setDeleting(true);
    const res = await fetch(`/api/wisdom/${post.id}`, { method: "DELETE" });
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
          aria-label="Upvote"
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
          aria-label="Downvote"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sprout/25 px-2.5 py-0.5 text-xs font-medium text-sprout-deep">
            {wisdomCategoryLabels[post.category]}
          </span>
          {post.location ? (
            <span className="flex items-center gap-1 text-xs text-ink/45">
              <MapPin className="h-3 w-3" /> {post.location}
            </span>
          ) : null}
        </div>
        <h3 className="mt-2 font-display text-2xl">{post.title}</h3>
        <p className="mt-1 text-sm text-ink/65">{post.body}</p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-ink/40">
            {post.author.firstName} {post.author.lastName}
          </p>
          {canDelete ? (
            <button
              onClick={remove}
              disabled={deleting}
              className="focus-ring inline-flex items-center gap-1 text-xs text-ink/35 transition-colors hover:text-danger disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Removing…" : "Remove"}
            </button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`focus-ring rounded-full border px-4 py-1.5 text-sm transition-colors ${
        active ? "border-gold bg-gold/10 text-ink" : "border-ink/15 text-ink/50 hover:border-ink/35"
      }`}
    >
      {children}
    </button>
  );
}
