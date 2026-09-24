"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, MessageSquareText, Trash2 } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { wisdomCategories, wisdomCategoryLabels } from "@/lib/wisdom-validation";

type ApiTopic = {
  id: string;
  title: string;
  description: string | null;
  category: (typeof wisdomCategories)[number];
  requireLocation: boolean;
  createdById: string;
  createdBy: { firstName: string; lastName: string };
  _count: { recommendations: number };
};

export function WisdomTopicList({ currentUserId, isAdmin = false }: { currentUserId: string | null; isAdmin?: boolean }) {
  const [topics, setTopics] = useState<ApiTopic[] | null>(null);
  const [category, setCategory] = useState<(typeof wisdomCategories)[number] | "ALL">("ALL");

  useEffect(() => {
    let cancelled = false;
    const qs = category === "ALL" ? "" : `?category=${category}`;
    fetch(`/api/wisdom${qs}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setTopics(data.topics ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

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

      {topics === null ? (
        <p className="mt-10 text-sm text-ink/40">Loading topics…</p>
      ) : topics.length === 0 ? (
        <p className="mt-10 text-ink/50">Nothing here yet. Start the first topic.</p>
      ) : (
        <StaggerGroup className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {topics.map((topic) => (
            <StaggerItem key={topic.id}>
              <TopicCard
                topic={topic}
                canDelete={isAdmin || topic.createdById === currentUserId}
                onDeleted={() => setTopics((prev) => (prev ? prev.filter((t) => t.id !== topic.id) : prev))}
              />
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}

function TopicCard({
  topic,
  canDelete,
  onDeleted,
}: {
  topic: ApiTopic;
  canDelete: boolean;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    if (!window.confirm("Remove this topic and every recommendation in it?")) return;
    setDeleting(true);
    const res = await fetch(`/api/wisdom/${topic.id}`, { method: "DELETE" });
    if (res.ok) onDeleted();
    else setDeleting(false);
  };

  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-sprout/25 px-2.5 py-0.5 text-xs font-medium text-sprout-deep">
          {wisdomCategoryLabels[topic.category]}
        </span>
        {topic.requireLocation ? (
          <span className="flex items-center gap-1 text-xs text-ink/45">
            <MapPin className="h-3 w-3" /> Location required
          </span>
        ) : null}
      </div>

      <Link href={`/wisdom/${topic.id}`} className="focus-ring mt-2 block">
        <h3 className="font-display text-2xl">{topic.title}</h3>
      </Link>
      {topic.description ? <p className="mt-1 line-clamp-2 text-sm text-ink/65">{topic.description}</p> : null}

      <div className="mt-4 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs text-ink/40">
          <MessageSquareText className="h-3.5 w-3.5" />
          {topic._count.recommendations} recommendation{topic._count.recommendations === 1 ? "" : "s"}
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
      <p className="mt-2 text-xs text-ink/35">
        Started by {topic.createdBy.firstName} {topic.createdBy.lastName}
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
