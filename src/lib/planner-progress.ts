import { getMajorRequirements, type RequirementUnit } from "@/lib/major-requirements";
import { isLanguageCourse } from "@/lib/planner-language";

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

export function computeMajorProgress(major: string | null, track: string | null, courses: PlannedCourseLike[]): MajorProgress | null {
  if (!major) return null;
  const requirements = getMajorRequirements(major, track);
  if (!requirements) return null;

  const categories: MajorProgress["categories"] = {};
  let totalUnits = 0;
  let metUnits = 0;

  for (const [category, units] of Object.entries(requirements.categories)) {
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

export const GEN_ED_TAG_LABELS: Record<string, string> = {
  COMMON_CORE_Y1: "Common Core (Yr 1)",
  COMMON_CORE_Y2: "Common Core (Yr 2)",
  COMMON_CORE_Y3: "Common Core (Yr 3)",
  DISTRIBUTION_NAS: "Distribution: Natural Science",
  DISTRIBUTION_SS: "Distribution: Social Science",
  DISTRIBUTION_ARHU: "Distribution: Arts & Humanities",
  QUANTITATIVE_REASONING: "Quantitative Reasoning",
  WRITING: "Writing",
  DUKE_FACULTY: "Duke Faculty-Taught",
};

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
