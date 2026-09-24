// Official DKU course subjects, sourced from the 2025-2026 Undergraduate
// Bulletin's course catalog ("Courses with Course Subject: ..." headers). Used
// as the department dropdown for both Courses and Professors, and to resolve a
// department from a course code prefix. Regenerate from a newer bulletin by
// re-running the same extraction rather than hand-editing.
export const DKU_SUBJECTS: { code: string; name: string }[] = [
  { code: "ARTS", name: "Arts" },
  { code: "ARHU", name: "Arts and Humanities" },
  { code: "BEHAVSCI", name: "Behavior Science" },
  { code: "BIOL", name: "Biology" },
  { code: "CAPSTONE", name: "Capstone" },
  { code: "CHEM", name: "Chemistry" },
  { code: "CHINESE", name: "Chinese" },
  { code: "CHSC", name: "Chinese Society and Culture" },
  { code: "COMPDSGN", name: "Computer Design" },
  { code: "COMPSCI", name: "Computer Science" },
  { code: "CULANTH", name: "Cultural Anthropology" },
  { code: "CULMOVE", name: "Cultures and Movements" },
  { code: "CULSOC", name: "Cultures and Societies" },
  { code: "DKU", name: "DKU" },
  { code: "ECON", name: "Economics" },
  { code: "ENGLISH", name: "English" },
  { code: "EAP", name: "English for Academic Purposes" },
  { code: "ENVIR", name: "Environment" },
  { code: "ETHLDR", name: "Ethics and Leadership" },
  { code: "FRENCH", name: "French" },
  { code: "GERMAN", name: "German" },
  { code: "GCHINA", name: "Global China Studies" },
  { code: "GCULS", name: "Global Cultural Studies" },
  { code: "GLHLTH", name: "Global Health" },
  { code: "HIST", name: "History" },
  { code: "HUM", name: "Humanities" },
  { code: "INFOSCI", name: "Information Science" },
  { code: "INTGSCI", name: "Integrated Science" },
  { code: "ITALIAN", name: "Italian" },
  { code: "JAPANESE", name: "Japanese" },
  { code: "KOREAN", name: "Korean" },
  { code: "LATIN", name: "Latin" },
  { code: "LIT", name: "Literature" },
  { code: "MATSCI", name: "Material Science" },
  { code: "MATH", name: "Mathematics" },
  { code: "MEDIA", name: "Media" },
  { code: "MEDIART", name: "Media and Arts" },
  { code: "MILITSCI", name: "Military Science" },
  { code: "NEUROSCI", name: "Neuroscience" },
  { code: "PHIL", name: "Philosophy" },
  { code: "PPE", name: "Philosophy, Politics and Economics" },
  { code: "PHYS", name: "Physics" },
  { code: "POLECON", name: "Political Economy" },
  { code: "POLSCI", name: "Political Science" },
  { code: "PSYCH", name: "Psychology" },
  { code: "PUBPOL", name: "Public Policy" },
  { code: "RELIG", name: "Religious Studies" },
  { code: "SOSC", name: "Social Science" },
  { code: "SOCIOL", name: "Sociology" },
  { code: "SPANISH", name: "Spanish" },
  { code: "STATS", name: "Statistics" },
  { code: "WOC", name: "Written and Oral Communication" },
];

export const DKU_DEPARTMENTS = [...DKU_SUBJECTS.map((s) => s.name), "Other"] as const;

export type Department = (typeof DKU_DEPARTMENTS)[number];

export const subjectCodeToDepartment: Record<string, string> = Object.fromEntries(
  DKU_SUBJECTS.map((s) => [s.code, s.name]),
);
