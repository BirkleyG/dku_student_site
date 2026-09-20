import type { EventCategory } from "@prisma/client";

type CategoryMeta = {
  key: EventCategory;
  group: string;
  label: string;
  /** Solid color — dots, chip text, event borders. */
  color: string;
  /** Soft background tint for chips and highlighted cells. */
  tint: string;
};

// Hue order below sweeps blue (Academic) → violet-gray (Administrative) →
// gold (Clubs) → orange (Sports) → rose/magenta/purple (RA, Social, Parties),
// so the numbered grouping in the product spec reads as a visual gradient —
// categories that were numbered close together land close on the wheel too.
export const EVENT_CATEGORIES: CategoryMeta[] = [
  { key: "NATURAL_SCIENCE", group: "Academic", label: "Natural Science", color: "#4f89b0", tint: "#d9e2e8" },
  { key: "SOCIAL_SCIENCE", group: "Academic", label: "Social Science", color: "#5b74ae", tint: "#e0e3eb" },
  { key: "ARTS_HUMANITIES", group: "Academic", label: "Arts & Humanities", color: "#7b6db0", tint: "#e9e7ee" },
  { key: "ADMINISTRATIVE", group: "Administrative", label: "Administrative", color: "#676c83", tint: "#d2d3da" },
  { key: "CLUBS", group: "Clubs", label: "Clubs", color: "#b5954a", tint: "#e9e4d8" },
  { key: "SPORTS_OPEN_PLAY", group: "Sports", label: "Open Play", color: "#ca8149", tint: "#f3e9e2" },
  { key: "SPORTS_TOURNAMENTS", group: "Sports", label: "Local Tournaments / Matches", color: "#c65539", tint: "#edd9d4" },
  { key: "RA_EVENTS", group: "Residential Life", label: "RA Events", color: "#c16776", tint: "#f0e5e7" },
  { key: "SOCIAL_EVENTS", group: "Social", label: "Social Events", color: "#b65d90", tint: "#efe6eb" },
  { key: "PARTIES", group: "Social", label: "Parties", color: "#b159b1", tint: "#ebe0eb" },
];

export const EVENT_CATEGORY_MAP: Record<EventCategory, CategoryMeta> = Object.fromEntries(
  EVENT_CATEGORIES.map((c) => [c.key, c]),
) as Record<EventCategory, CategoryMeta>;

export const EVENT_CATEGORY_GROUPS: { group: string; categories: CategoryMeta[] }[] = (() => {
  const groups: { group: string; categories: CategoryMeta[] }[] = [];
  for (const cat of EVENT_CATEGORIES) {
    const existing = groups.find((g) => g.group === cat.group);
    if (existing) existing.categories.push(cat);
    else groups.push({ group: cat.group, categories: [cat] });
  }
  return groups;
})();
