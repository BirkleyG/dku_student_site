// Subjects that count toward DKU's language requirement. The requirement
// itself is policy-based (EAP track vs. CSL/Chinese track vs. exempt), not a
// fixed course list, so any course under one of these subject codes is
// treated as satisfying it.
const LANGUAGE_SUBJECTS = [
  "CHINESE",
  "EAP",
  "ENGLISH",
  "FRENCH",
  "GERMAN",
  "ITALIAN",
  "JAPANESE",
  "KOREAN",
  "LATIN",
  "SPANISH",
];

export function isLanguageCourse(code: string): boolean {
  const subject = code.trim().split(/\s+/)[0]?.toUpperCase();
  return subject != null && LANGUAGE_SUBJECTS.includes(subject);
}
