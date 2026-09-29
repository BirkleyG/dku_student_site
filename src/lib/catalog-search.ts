import { DKU_COURSE_CATALOG, type CatalogCourse } from "@/lib/course-catalog";

const compact = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Search the catalog by course code (also cross-listed codes, ignoring spaces
 * so "chinese201b" works) or by title/department words in any order
 * ("intermediate chinese"). Case-insensitive, partial matches. Code matches
 * sort ahead of title-only matches.
 */
export function searchCatalog(query: string, limit = 30): CatalogCourse[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  const compactQuery = compact(q);

  const scored: { course: CatalogCourse; score: number }[] = [];
  for (const course of DKU_COURSE_CATALOG) {
    const codes = [course.code, ...course.crossListed];
    const compactCodes = codes.map(compact);
    let score = -1;
    if (compactCodes.some((c) => c.startsWith(compactQuery))) score = 0;
    else if (compactCodes.some((c) => c.includes(compactQuery))) score = 1;
    else {
      const hay = `${codes.join(" ")} ${course.title} ${course.department}`.toLowerCase();
      const compactHay = compact(hay);
      if (tokens.every((t) => hay.includes(t) || compactHay.includes(compact(t)))) score = 2;
    }
    if (score >= 0) scored.push({ course, score });
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((s) => s.course);
}
