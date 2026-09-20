"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";

type ApiPost = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  author: { firstName: string; lastName: string };
  _count: { comments: number };
};

export function BoardFeed() {
  const [posts, setPosts] = useState<ApiPost[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/board")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setPosts(data.posts ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (posts === null) {
    return <p className="mt-10 text-sm text-ink/40">Loading the board…</p>;
  }

  if (posts.length === 0) {
    return <p className="mt-10 text-ink/50">Nothing posted yet. Say the first thing.</p>;
  }

  return (
    <StaggerGroup className="mt-8 space-y-4">
      {posts.map((post) => (
        <StaggerItem key={post.id}>
          <Link href={`/social/${post.id}`} className="focus-ring block">
            <Card className="transition-transform duration-300 hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl">{post.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-ink/60">{post.body}</p>
                  <p className="mt-3 text-xs text-ink/40">
                    {post.author.firstName} {post.author.lastName} ·{" "}
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-sm text-ink/50">
                  <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
                  {post._count.comments}
                </div>
              </div>
            </Card>
          </Link>
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}
