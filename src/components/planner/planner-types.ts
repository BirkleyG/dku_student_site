export type ApiPlannedCourse = {
  id: string;
  year: number;
  semester: "FALL" | "SPRING";
  session: "SESSION_1" | "SESSION_2" | "FULL" | "MINI_TERM";
  code: string;
  title: string | null;
  credits: string | null;
  isCrNc: boolean;
  genEdTags: string[];
};

export type ApiPlan = {
  id: string;
  name: string;
  isPrimary: boolean;
  major: string | null;
  track: string | null;
  miniTermCompleted: boolean;
  courses: ApiPlannedCourse[];
};

export const CATEGORY_COLORS: Record<string, string> = {
  divisionalFoundation: "bg-sky-100 text-sky-800 border-sky-300",
  interdisciplinary: "bg-violet-100 text-violet-800 border-violet-300",
  disciplinary: "bg-rose-100 text-rose-800 border-rose-300",
  electives: "bg-amber-100 text-amber-800 border-amber-300",
  requiredForEveryone: "bg-teal-100 text-teal-800 border-teal-300",
};

export const DEFAULT_CHIP_COLOR = "bg-paper-dim text-ink/70 border-ink/15";
export const LANGUAGE_CHIP_COLOR = "bg-emerald-100 text-emerald-800 border-emerald-300";
