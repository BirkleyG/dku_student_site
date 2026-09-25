"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Search, ArrowUpRight } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { LilypadCategory, LilypadPost } from "@/lib/lilypad";
import { useT } from "@/lib/i18n/client";

export function LilypadFeed({
  initialPosts,
  initialTotalPages,
  categories,
}: {
  initialPosts: LilypadPost[];
  initialTotalPages: number;
  categories: LilypadCategory[];
}) {
  const t = useT("news");
  const [categoryId, setCategoryId] = useState<number | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const isFirstRun = useRef(true);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ page: "1" });
    if (categoryId !== "ALL") params.set("categoryId", String(categoryId));
    if (debouncedQuery) params.set("q", debouncedQuery);

    fetch(`/api/lilypad?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setPosts(data.posts ?? []);
        setTotalPages(data.totalPages ?? 0);
        setPage(1);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId, debouncedQuery]);

  const loadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    const params = new URLSearchParams({ page: String(nextPage) });
    if (categoryId !== "ALL") params.set("categoryId", String(categoryId));
    if (debouncedQuery) params.set("q", debouncedQuery);

    try {
      const res = await fetch(`/api/lilypad?${params.toString()}`);
      const data = await res.json();
      setPosts((prev) => [...prev, ...(data.posts ?? [])]);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={categoryId === "ALL"} onClick={() => setCategoryId("ALL")}>
            {t("allCategory")}
          </FilterChip>
          {categories.map((c) => (
            <FilterChip key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
              {c.name}
            </FilterChip>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="focus-ring w-full rounded-full border border-ink/15 bg-paper py-2 pl-9 pr-4 text-sm text-ink placeholder:text-ink/35"
          />
        </div>
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-ink/40">{t("loadingArticles")}</p>
      ) : posts.length === 0 ? (
        <p className="mt-10 text-ink/50">{t("noArticles")}</p>
      ) : (
        <StaggerGroup className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <StaggerItem key={post.id}>
              <LilypadCardView post={post} activeCategoryId={categoryId} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}

      {!loading && page < totalPages ? (
        <div className="mt-8 flex justify-center">
          <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? t("loadingMore") : t("loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function LilypadCardView({ post, activeCategoryId }: { post: LilypadPost; activeCategoryId: number | "ALL" }) {
  const t = useT("news");
  const displayCategory =
    activeCategoryId !== "ALL" ? (post.categories.find((c) => c.id === activeCategoryId)?.name ?? null) : post.category;

  return (
    <a
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      className="focus-ring block h-full"
    >
      <Card className="flex h-full flex-col overflow-hidden p-0 transition-transform duration-300 hover:-translate-y-0.5">
        <div className="relative aspect-[16/10] w-full shrink-0 bg-sprout/15">
          {post.image ? (
            <Image src={post.image} alt="" fill unoptimized className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-display text-lg italic text-ink/25">The Lilypad</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="text-xs uppercase tracking-wide text-ink/40">
            {format(new Date(post.date), "MMM d, yyyy")}
            {displayCategory ? <span className="text-gold-bright"> · {displayCategory}</span> : null}
          </p>
          <h3 className="mt-1.5 font-display text-xl leading-snug">{post.title}</h3>
          <p className="mt-1.5 line-clamp-3 text-sm text-ink/60">{post.excerpt}</p>
          <p className="mt-auto flex items-center gap-1 pt-4 text-xs font-medium text-ink/50">
            {t("readOnLilypad")} <ArrowUpRight className="h-3.5 w-3.5" />
          </p>
        </div>
      </Card>
    </a>
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
