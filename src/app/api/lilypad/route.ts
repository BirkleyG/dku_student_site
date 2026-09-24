import { NextResponse } from "next/server";
import { getLilypadPosts } from "@/lib/lilypad";

const PER_PAGE = 9;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const categoryParam = url.searchParams.get("categoryId");
  const categoryId = categoryParam ? Number(categoryParam) || undefined : undefined;
  const search = url.searchParams.get("q")?.trim() || undefined;

  const { posts, totalPages } = await getLilypadPosts({ page, perPage: PER_PAGE, categoryId, search });

  return NextResponse.json({ posts, totalPages, page });
}
