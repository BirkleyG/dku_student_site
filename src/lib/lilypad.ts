const LILYPAD_ORIGIN = "https://sites.duke.edu/thelilypad";

export const LILYPAD_SITE_URL = LILYPAD_ORIGIN;

export type LilypadCategory = {
  id: number;
  name: string;
  slug: string;
  count: number;
};

export type LilypadPost = {
  id: number;
  title: string;
  excerpt: string;
  link: string;
  image: string | null;
  category: string | null;
  categoryId: number | null;
  categories: { id: number; name: string }[];
  author: string | null;
  date: string;
};

type WpTerm = { id: number; name: string; slug: string; taxonomy: string };

type WpPost = {
  id: number;
  date: string;
  link: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url?: string }>;
    "wp:term"?: WpTerm[][];
    author?: Array<{ name?: string }>;
  };
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
};

function decodeEntities(input: string): string {
  return input.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const num = code[1]?.toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      if (!Number.isNaN(num)) return String.fromCodePoint(num);
      return match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " "))
    .replace(/\s*\[\s*(?:…|\.\.\.)\s*\]\s*$/, "")
    .trim();
}

function firstImageFrom(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function toLilypadPost(item: WpPost): LilypadPost {
  const featured = item._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  const image = featured || firstImageFrom(item.content?.rendered ?? "") || null;
  const terms = (item._embedded?.["wp:term"] ?? []).flat();
  const categoryTerms = terms.filter((t) => t.taxonomy === "category" && t.slug !== "uncategorized");
  const categoryTerm = categoryTerms[0];
  const author = item._embedded?.author?.[0]?.name ?? null;

  return {
    id: item.id,
    title: stripHtml(item.title.rendered),
    excerpt: stripHtml(item.excerpt.rendered),
    link: item.link,
    image,
    category: categoryTerm ? decodeEntities(categoryTerm.name) : null,
    categoryId: categoryTerm ? categoryTerm.id : null,
    categories: categoryTerms.map((t) => ({ id: t.id, name: decodeEntities(t.name) })),
    author,
    date: item.date,
  };
}

export async function getLilypadCategories(): Promise<LilypadCategory[]> {
  try {
    const params = new URLSearchParams({ rest_route: "/wp/v2/categories", per_page: "50" });
    const res = await fetch(`${LILYPAD_ORIGIN}/?${params.toString()}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ id: number; name: string; slug: string; count: number }>;
    return data
      .filter((c) => c.count > 0 && c.slug !== "uncategorized")
      .map((c) => ({ id: c.id, name: decodeEntities(c.name), slug: c.slug, count: c.count }))
      .sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

export async function getLilypadPosts(options: {
  page?: number;
  perPage?: number;
  categoryId?: number;
  search?: string;
} = {}): Promise<{ posts: LilypadPost[]; totalPages: number }> {
  const { page = 1, perPage = 9, categoryId, search } = options;
  const params = new URLSearchParams({
    rest_route: "/wp/v2/posts",
    _embed: "1",
    per_page: String(perPage),
    page: String(page),
  });
  if (categoryId) params.set("categories", String(categoryId));
  if (search) params.set("search", search);

  try {
    const res = await fetch(`${LILYPAD_ORIGIN}/?${params.toString()}`, { next: { revalidate: 900 } });
    if (!res.ok) return { posts: [], totalPages: 0 };
    const totalPages = Number(res.headers.get("x-wp-totalpages") ?? "0");
    const data = (await res.json()) as WpPost[];
    return { posts: data.map(toLilypadPost), totalPages };
  } catch {
    return { posts: [], totalPages: 0 };
  }
}
