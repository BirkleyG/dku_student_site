// Courses every DKU undergraduate must take, regardless of major. They get
// their own planner category so they aren't mixed into major requirements.
// (GCHINA 101 / GLOCHALL 201 / ETHLDR 201 are also the three Common Core
// courses that fill the Common Core rows of the exported plan; see
// src/lib/common-core.ts.)
export const REQUIRED_FOR_EVERYONE: { code: string; title: string }[] = [
  { code: "GCHINA 101", title: "China in the World" },
  { code: "ETHLDR 201", title: "Ethics, Citizenship and the Examined Life" },
  { code: "GLOCHALL 201", title: "Global Challenges in Science, Technology, and Health" },
  { code: "DKU 101", title: "DKU 101" },
];

export function isRequiredForEveryone(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  return REQUIRED_FOR_EVERYONE.some((c) => c.code === normalized);
}
