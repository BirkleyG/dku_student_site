// DKU's three Common Core courses are fixed by policy — every student takes
// the same course in the same designated year, unlike Distribution/QR which
// vary by which course the student picks. So these are auto-detected by
// course code rather than user-tagged, unlike the rest of General Education.
export const COMMON_CORE_COURSES: { year: 1 | 2 | 3; code: string; title: string }[] = [
  { year: 1, code: "GCHINA 101", title: "China in the World" },
  { year: 2, code: "GLOCHALL 201", title: "Global Challenges in Science, Technology, and Health" },
  { year: 3, code: "ETHLDR 201", title: "Ethics, Citizenship and the Examined Life" },
];

export function commonCoreYearForCode(code: string): 1 | 2 | 3 | null {
  const normalized = code.trim().toUpperCase();
  return COMMON_CORE_COURSES.find((c) => c.code === normalized)?.year ?? null;
}
