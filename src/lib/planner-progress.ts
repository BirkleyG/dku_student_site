import { getMajorRequirements, type RequirementUnit } from "@/lib/major-requirements";
import { isLanguageCourse } from "@/lib/planner-language";
import { commonCoreYearForCode } from "@/lib/common-core";
import { REQUIRED_FOR_EVERYONE } from "@/lib/required-for-everyone";

export type PlannedCourseLike = {
  id: string;
  code: string;
  credits: string | null;
  isCrNc: boolean;
  genEdTags: string[];
};

export type RequirementUnitStatus = {
  unit: RequirementUnit;
  satisfiedBy: string | null; // planned-course id that satisfies this unit, if any
  label: string; // "SOSC 102" or "MATH 101 or MATH 105"
};

export type MajorProgress = {
  categories: Record<string, { total: number; met: number; units: RequirementUnitStatus[] }>;
  totalUnits: number;
  metUnits: number;
  percent: number;
};

function unitLabel(unit: RequirementUnit): string {
  if (unit.type === "single") return unit.codes.join(" / ");
  return unit.options.map((opt) => opt.join(" / ")).join(" or ");
}

function unitMatchesCode(unit: RequirementUnit, code: string): boolean {
  const normalized = code.trim().toUpperCase();
  if (unit.type === "single") return unit.codes.some((c) => c.toUpperCase() === normalized);
  return unit.options.some((opt) => opt.some((c) => c.toUpperCase() === normalized));
}

// A requirement is fulfilled once a *credited* (non-CR/NC) course fills it —
// a Credit/No Credit course doesn't count toward it, so it should stay
// visible/pickable in the add-course browser.
export function isUnitSatisfiedByCredited(unit: RequirementUnit, courses: { code: string; isCrNc: boolean }[]): boolean {
  const codes = unit.type === "single" ? unit.codes : unit.options.flat();
  return codes.some((code) => courses.some((c) => !c.isCrNc && c.code.trim().toUpperCase() === code.toUpperCase()));
}

export function computeMajorProgress(major: string | null, track: string | null, courses: PlannedCourseLike[]): MajorProgress | null {
  if (!major) return null;
  const requirements = getMajorRequirements(major, track);
  if (!requirements) return null;

  const categories: MajorProgress["categories"] = {};
  let totalUnits = 0;
  let metUnits = 0;

  for (const [category, units] of Object.entries(requirements.categories)) {
    // Electives are "pick from this list" pools, not requirements — they
    // don't count toward (or appear in) major progress.
    if (category === "electives") continue;
    const statuses: RequirementUnitStatus[] = (units ?? []).map((unit) => {
      const match = courses.find((c) => unitMatchesCode(unit, c.code));
      return { unit, satisfiedBy: match?.id ?? null, label: unitLabel(unit) };
    });
    const met = statuses.filter((s) => s.satisfiedBy).length;
    categories[category] = { total: statuses.length, met, units: statuses };
    totalUnits += statuses.length;
    metUnits += met;
  }

  return {
    categories,
    totalUnits,
    metUnits,
    percent: totalUnits > 0 ? Math.round((metUnits / totalUnits) * 100) : 0,
  };
}

export type RequiredForEveryoneStatus = {
  items: { code: string; title: string; course: PlannedCourseLike | null }[];
  miniTermCompleted: boolean;
  met: number;
  total: number;
};

// "Required for everyone" = the four fixed courses plus the miniterm checkbox.
export function computeRequiredForEveryone(courses: PlannedCourseLike[], miniTermCompleted: boolean): RequiredForEveryoneStatus {
  const items = REQUIRED_FOR_EVERYONE.map((r) => ({
    ...r,
    course: courses.find((c) => c.code.trim().toUpperCase() === r.code) ?? null,
  }));
  return {
    items,
    miniTermCompleted,
    met: items.filter((i) => i.course).length + (miniTermCompleted ? 1 : 0),
    total: items.length + 1,
  };
}

// Which major-requirement category (if any) a single placed course satisfies —
// used to color/highlight a course chip in the grid.
export function findRequirementCategoryForCode(major: string | null, track: string | null, code: string): string | null {
  if (!major) return null;
  const requirements = getMajorRequirements(major, track);
  if (!requirements) return null;
  for (const [category, units] of Object.entries(requirements.categories)) {
    if ((units ?? []).some((unit) => unitMatchesCode(unit, code))) return category;
  }
  return null;
}

// Common Core (COMMON_CORE_Y1/Y2/Y3) is intentionally absent here — it's
// three fixed, policy-mandated courses (see src/lib/common-core.ts),
// auto-detected by code rather than a tag the user picks.
export const GEN_ED_TAG_LABELS: Record<string, string> = {
  DISTRIBUTION_NAS: "Natural Science",
  DISTRIBUTION_SS: "Social Science",
  DISTRIBUTION_ARHU: "Arts & Humanities",
  QUANTITATIVE_REASONING: "Quantitative Reasoning",
  WRITING: "Writing",
  DUKE_FACULTY: "Duke Faculty-Taught",
};

// Grouped for the tag picker UI: the first four are mutually exclusive
// Distribution/QR slots (see resolveExclusiveGenEd below) and read naturally
// as one cluster; the rest are independent, cross-cutting flags.
export const GEN_ED_TAG_GROUPS: { label: string; tags: string[] }[] = [
  { label: "Distribution & QR", tags: ["DISTRIBUTION_NAS", "DISTRIBUTION_SS", "DISTRIBUTION_ARHU", "QUANTITATIVE_REASONING"] },
  { label: "Other", tags: ["WRITING", "DUKE_FACULTY"] },
];

// A course can be *eligible* for several Distribution/QR tags at once (e.g. a
// stats course could plausibly count as either Quantitative Reasoning or
// Natural Science), but DKU only lets it count toward exactly one — so these
// four are mutually exclusive across the whole plan. We resolve which course
// claims which slot with a small bipartite matching (each of the 4 slots
// wants at most one course; each course fills at most one slot) that
// maximizes how many of the 4 slots get filled, rather than resolving
// course-by-course in placement order, so adding a course later can still
// "free up" a slot for an earlier one.
export const EXCLUSIVE_GEN_ED_TAGS = [
  "DISTRIBUTION_NAS",
  "DISTRIBUTION_SS",
  "DISTRIBUTION_ARHU",
  "QUANTITATIVE_REASONING",
] as const;

export type GenEdAssignment = {
  // category -> the one planned-course id resolved to fill it, if any
  slotAssignment: Record<string, string | null>;
  // planned-course id -> the one category it was resolved to count for, if any
  courseAssignment: Record<string, string>;
};

export function resolveExclusiveGenEd(courses: PlannedCourseLike[]): GenEdAssignment {
  const slots = EXCLUSIVE_GEN_ED_TAGS;
  const eligible = courses.filter((c) => c.genEdTags.some((t) => (slots as readonly string[]).includes(t)));

  const slotAssignment: Record<string, string | null> = Object.fromEntries(slots.map((s) => [s, null]));
  const courseAssignment: Record<string, string> = {};

  // Standard augmenting-path bipartite matching (Kuhn's algorithm) — tiny
  // inputs (4 slots), so no need for anything fancier.
  function tryAssign(courseId: string, eligibleTags: string[], visited: Set<string>): boolean {
    for (const slot of eligibleTags) {
      if (visited.has(slot)) continue;
      visited.add(slot);
      const currentHolder = slotAssignment[slot];
      if (currentHolder === null) {
        slotAssignment[slot] = courseId;
        courseAssignment[courseId] = slot;
        return true;
      }
      const holderTags = courses.find((c) => c.id === currentHolder)?.genEdTags.filter((t) => slots.includes(t as (typeof slots)[number])) ?? [];
      if (tryAssign(currentHolder, holderTags, visited)) {
        slotAssignment[slot] = courseId;
        courseAssignment[courseId] = slot;
        return true;
      }
    }
    return false;
  }

  for (const course of eligible) {
    const tags = course.genEdTags.filter((t) => (slots as readonly string[]).includes(t));
    tryAssign(course.id, tags, new Set());
  }

  return { slotAssignment, courseAssignment };
}

export function getCommonCoreStatus<T extends { code: string }>(courses: T[]): Record<1 | 2 | 3, T | null> {
  const byYear: Record<1 | 2 | 3, T | null> = { 1: null, 2: null, 3: null };
  for (const course of courses) {
    const year = commonCoreYearForCode(course.code);
    if (year) byYear[year] = course;
  }
  return byYear;
}

const TOTAL_CREDITS_REQUIRED = 136;

export function computeDegreeProgress(courses: PlannedCourseLike[]) {
  const totalCredits = courses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  const crnCredits = courses.filter((c) => c.isCrNc).reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  const languageCredits = courses.filter((c) => isLanguageCourse(c.code)).reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  const dukeFacultyCredits = courses
    .filter((c) => c.genEdTags.includes("DUKE_FACULTY"))
    .reduce((sum, c) => sum + (Number(c.credits) || 0), 0);

  return {
    totalCredits,
    creditsNeeded: TOTAL_CREDITS_REQUIRED,
    percent: Math.min(100, Math.round((totalCredits / TOTAL_CREDITS_REQUIRED) * 100)),
    crnCredits,
    crnCap: 16,
    languageCredits,
    dukeFacultyCredits,
    dukeFacultyCap: 24,
  };
}
