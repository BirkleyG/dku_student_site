// Pulls the latest articles from The Lilypad (a WordPress site on
// sites.duke.edu) so DKU Life can show them until we have admin access to
// post there directly. Tries the WordPress REST API first (it includes
// featured images), then the RSS feed. Cached for 15 minutes.

export const LILYPAD_URL = (process.env.LILYPAD_URL ?? "https://sites.duke.edu/thelilypad").replace(/\/$/, "");

export type LilypadPost = {
  id: string;
  title: string;
  link: string;
  date: string | null;
  excerpt: string;
  image: string | null;
};

const REVALIDATE_SECONDS = 15 * 60;
const TIMEOUT_MS = 4000;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  hellip: "…", mdash: "—", ndash: "–", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

function plainText(html: string, maxLength = 220): string {
  let text = decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .replace(/The post .* appeared first on .*$/i, "")
    .trim();
  // WordPress ends excerpts with "[…]"; swap it for a single ellipsis.
  if (/\[(…|\.\.\.)\]$/.test(text)) {
    text = text.replace(/\s*\[(…|\.\.\.)\]$/, "");
    if (!/[.!?…]$/.test(text)) text += "…";
  }
  return text.length > maxLength ? `${text.slice(0, maxLength).replace(/\s+\S*$/, "")}…` : text;
}

function httpsOnly(url: unknown): string | null {
  return typeof url === "string" && /^https?:\/\//i.test(url) ? url : null;
}

async function get(url: string): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "DKU Life (student site)" },
    });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

type WpPost = {
  id: number;
  date?: string;
  link?: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
  jetpack_featured_media_url?: string;
  _embedded?: { "wp:featuredmedia"?: { source_url?: string }[] };
};

async function fromRestApi(limit: number): Promise<LilypadPost[] | null> {
  const res = await get(`${LILYPAD_URL}/wp-json/wp/v2/posts?per_page=${limit}&_embed=wp:featuredmedia`);
  if (!res) return null;
  const posts = (await res.json().catch(() => null)) as WpPost[] | null;
  if (!Array.isArray(posts)) return null;
  return posts
    .filter((p) => httpsOnly(p.link))
    .map((p) => ({
      id: String(p.id),
      title: decodeEntities(p.title?.rendered ?? "").replace(/<[^>]*>/g, "").trim() || "Untitled",
      link: p.link!,
      date: p.date ?? null,
      excerpt: plainText(p.excerpt?.rendered ?? ""),
      image: httpsOnly(p._embedded?.["wp:featuredmedia"]?.[0]?.source_url) ?? httpsOnly(p.jetpack_featured_media_url),
    }));
}

function tag(xml: string, name: string): string {
  const match = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  if (!match) return "";
  return match[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

async function fromRss(limit: number): Promise<LilypadPost[] | null> {
  const res = await get(`${LILYPAD_URL}/feed/`);
  if (!res) return null;
  const xml = await res.text();
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi);
  if (!items) return null;
  return items.slice(0, limit).flatMap((item, i) => {
    const link = httpsOnly(tag(item, "link"));
    if (!link) return [];
    const content = tag(item, "content:encoded") || tag(item, "description");
    const image =
      httpsOnly(item.match(/<media:content[^>]*url="([^"]+)"/i)?.[1]) ??
      httpsOnly(item.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i)?.[1]) ??
      httpsOnly(content.match(/<img[^>]*src="([^"]+)"/i)?.[1]);
    const pubDate = tag(item, "pubDate");
    return [
      {
        id: tag(item, "guid") || `${i}`,
        title: plainText(tag(item, "title"), 200) || "Untitled",
        link,
        date: pubDate ? new Date(pubDate).toISOString() : null,
        excerpt: plainText(tag(item, "description") || content),
        image: image ? decodeEntities(image) : null,
      },
    ];
  });
}

/** Latest Lilypad articles, or null if the site couldn't be reached. */
export async function fetchLilypadPosts(limit = 9): Promise<LilypadPost[] | null> {
  return (await fromRestApi(limit)) ?? (await fromRss(limit));
}
