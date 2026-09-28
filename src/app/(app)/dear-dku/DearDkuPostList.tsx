"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Link2, MessageSquareText, Trash2 } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { dearDkuCategories, dearDkuCategoryLabels } from "@/lib/dear-dku-validation";
import { useT } from "@/lib/i18n/client";

type ApiPost = {
  id: string;
  title: string;
  summary: string;
  category: (typeof dearDkuCategories)[number];
  submissionType: "GOOGLE_DOC" | "FILE";
  authorId: string;
  author: { firstName: string; lastName: string };
  _count: { comments: number };
};

export function DearDkuPostList({ currentUserId, isAdmin = false }: { currentUserId: string | null; isAdmin?: boolean }) {
  const t = useT("dearDku");
  const [posts, setPosts] = useState<ApiPost[] | null>(null);
  const [category, setCategory] = useState<(typeof dearDkuCategories)[number] | "ALL">("ALL");

  useEffect(() => {
    let cancelled = false;
    const qs = category === "ALL" ? "" : `?category=${category}`;
    fetch(`/api/dear-dku${qs}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setPosts(data.posts ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={category === "ALL"} onClick={() => setCategory("ALL")}>
          {t("all")}
        </FilterChip>
        {dearDkuCategories.map((c) => (
          <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>
            {dearDkuCategoryLabels[c]}
          </FilterChip>
        ))}
      </div>

      {posts === null ? (
        <p className="mt-10 text-sm text-ink/40">{t("loadingPosts")}</p>
      ) : posts.length === 0 ? (
        <p className="mt-10 text-ink/50">{t("nothingHerePublishFirst")}</p>
      ) : (
        <StaggerGroup className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {posts.map((post) => (
            <StaggerItem key={post.id}>
              <PostCard
                post={post}
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

function PostCard({
  post,
  canDelete,
  onDeleted,
}: {
  post: ApiPost;
  canDelete: boolean;
  onDeleted: () => void;
}) {
  const t = useT("dearDku");
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    if (!window.confirm(t("confirmRemovePost"))) return;
    setDeleting(true);
    const res = await fetch(`/api/dear-dku/${post.id}`, { method: "DELETE" });
    if (res.ok) onDeleted();
    else setDeleting(false);
  };

  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-sprout/25 px-2.5 py-0.5 text-xs font-medium text-sprout-deep">
          {dearDkuCategoryLabels[post.category]}
        </span>
        <span className="flex items-center gap-1 text-xs text-ink/45">
          {post.submissionType === "GOOGLE_DOC" ? <Link2 className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
          {post.submissionType === "GOOGLE_DOC" ? t("googleDoc") : t("uploadedFile")}
        </span>
      </div>

      <Link href={`/dear-dku/${post.id}`} className="focus-ring mt-2 block">
        <h3 className="font-display text-2xl">{post.title}</h3>
      </Link>
      <p className="mt-1 line-clamp-2 text-sm text-ink/65">{post.summary}</p>

      <div className="mt-4 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs text-ink/40">
          <MessageSquareText className="h-3.5 w-3.5" />
          {post._count.comments === 1
            ? t("feedbackCountOne", { count: post._count.comments })
            : t("feedbackCountOther", { count: post._count.comments })}
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
      <p className="mt-2 text-xs text-ink/35">
        {t("publishedBy", { name: `${post.author.firstName} ${post.author.lastName}` })}
      </p>
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
