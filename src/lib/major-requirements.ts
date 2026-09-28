// Major/track degree requirements extracted from the 2025-2026 Undergraduate
// Bulletin's "Majors (listed in alphabetical order)" section. Each entry is a
// major (with an optional track) and its four Bulletin-defined requirement
// categories. A "single" unit is one required course; an "or" unit is a slot
// satisfied by any one of its listed options (an option can itself list more
// than one code when the Bulletin cross-lists the same course under multiple
// subject codes). Regenerate from a newer bulletin rather than hand-editing —
// major requirements change year to year.
export type RequirementUnit =
  | { type: "single"; codes: string[] }
  | { type: "or"; options: string[][] };

export type MajorRequirementCategory =
  | "divisionalFoundation"
  | "interdisciplinary"
  | "disciplinary"
  | "electives";

export type MajorRequirements = {
  major: string;
  track: string | null;
  categories: Partial<Record<MajorRequirementCategory, RequirementUnit[]>>;
};

export const MAJOR_REQUIREMENTS: MajorRequirements[] = [
  {
    major: "Applied Mathematics and Computational Sciences",
    track: "Computer Science",
    categories: {
      divisionalFoundation: [{ type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "single", codes: ["PHYS 121"] }, { type: "single", codes: ["INTGSCI 205"] }, { type: "single", codes: ["BIOL 110"] }, { type: "single", codes: ["CHEM 110"] }, { type: "single", codes: ["PHYS 121"] }, { type: "single", codes: ["INTGSCI 205"] }],
      interdisciplinary: [{ type: "single", codes: ["STATS 102"] }, { type: "single", codes: ["MATH 201"] }, { type: "single", codes: ["MATH 202"] }, { type: "single", codes: ["MATH 206"] }, { type: "single", codes: ["MATH 302"] }],
      electives: [{ type: "single", codes: ["COMPSCI 303"] }, { type: "single", codes: ["COMPSCI 401"] }, { type: "single", codes: ["COMPSCI 404"] }, { type: "single", codes: ["COMPSCI 405"] }, { type: "single", codes: ["COMPSCI 208"] }, { type: "single", codes: ["MEDIART 206"] }, { type: "single", codes: ["COMPSCI 307"] }, { type: "single", codes: ["COMPSCI 320"] }, { type: "single", codes: ["COMPSCI 403"] }, { type: "single", codes: ["COMPSCI 406"] }, { type: "single", codes: ["COMPSCI 204"] }, { type: "single", codes: ["MATH 405"] }],
    },
  },
  {
    major: "Applied Mathematics and Computational Sciences",
    track: "Mathematics",
    categories: {
      divisionalFoundation: [{ type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "single", codes: ["PHYS 121"] }, { type: "single", codes: ["INTGSCI 205"] }, { type: "single", codes: ["BIOL 110"] }, { type: "single", codes: ["CHEM 110"] }, { type: "single", codes: ["PHYS 121"] }, { type: "single", codes: ["INTGSCI 205"] }],
      interdisciplinary: [{ type: "or", options: [["COMPSCI 101"], ["STATS 102"], ["COMPSCI 201"]] }, { type: "single", codes: ["MATH 201"] }, { type: "single", codes: ["MATH 202"] }, { type: "single", codes: ["MATH 206"] }, { type: "single", codes: ["MATH 302"] }],
      disciplinary: [{ type: "single", codes: ["MATH 203"] }, { type: "single", codes: ["MATH 303"] }, { type: "single", codes: ["MATH 307"] }, { type: "single", codes: ["MATH 308"] }, { type: "single", codes: ["MATH 401"] }, { type: "single", codes: ["MATH 409"] }, { type: "single", codes: ["MATH 403"] }, { type: "single", codes: ["MATH 405"] }, { type: "single", codes: ["MATH 406"] }],
      electives: [{ type: "single", codes: ["MATH 301"] }, { type: "single", codes: ["STATS 301"] }, { type: "single", codes: ["MATH 306"] }, { type: "single", codes: ["MATH 408"] }, { type: "single", codes: ["MATH 412"] }, { type: "single", codes: ["MATH 450"] }, { type: "single", codes: ["MATH 317"] }, { type: "single", codes: ["ECON 317"] }, { type: "single", codes: ["MATH 404"] }, { type: "single", codes: ["MATH 407"] }, { type: "single", codes: ["PHYS 407"] }, { type: "single", codes: ["MATH 411"] }, { type: "single", codes: ["ECON 411"] }, { type: "single", codes: ["MATH 413"] }, { type: "single", codes: ["COMPSCI 413"] }, { type: "single", codes: ["MATH 414"] }],
    },
  },
  {
    major: "Arts and Media",
    track: "Arts",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["ARHU 101"] }, { type: "single", codes: ["ARHU 102"] }],
      interdisciplinary: [{ type: "single", codes: ["MEDIART 209"] }, { type: "single", codes: ["MEDIART 490"] }],
      disciplinary: [{ type: "single", codes: ["HIST 207"] }, { type: "single", codes: ["HIST 210", "ARTS 210"] }, { type: "single", codes: ["HIST 106"] }, { type: "single", codes: ["GCHINA 203"] }, { type: "single", codes: ["ARTS 203"] }, { type: "single", codes: ["HIST 217"] }, { type: "single", codes: ["ARTS 217"] }, { type: "single", codes: ["HIST 218"] }, { type: "single", codes: ["ARTS 218"] }, { type: "single", codes: ["LIT 208"] }, { type: "single", codes: ["MEDIART 211"] }, { type: "single", codes: ["MEDIART 224"] }, { type: "single", codes: ["PHYS 105"] }, { type: "single", codes: ["ARTS 105"] }, { type: "single", codes: ["MEDIART 103"] }, { type: "single", codes: ["MEDIART 212"] }, { type: "single", codes: ["MEDIART 220"] }, { type: "single", codes: ["MEDIART 223"] }, { type: "single", codes: ["MEDIART 301"] }, { type: "single", codes: ["MEDIART 310"] }, { type: "single", codes: ["MEDIART 311"] }, { type: "single", codes: ["MEDIART 498"] }, { type: "single", codes: ["LIT 216"] }, { type: "single", codes: ["MEDIART 104"] }, { type: "single", codes: ["MEDIART 117"] }, { type: "single", codes: ["MEDIART 118"] }, { type: "single", codes: ["MEDIART 198"] }, { type: "single", codes: ["MEDIART 221"] }, { type: "single", codes: ["MEDIART 222"] }, { type: "single", codes: ["LIT 311"] }, { type: "single", codes: ["MEDIART 301"] }, { type: "single", codes: ["MEDIART 322"] }, { type: "single", codes: ["HUM 405"] }, { type: "single", codes: ["MEDIART 405"] }, { type: "single", codes: ["INFOSCI 105"] }, { type: "single", codes: ["INFOSCI 202"] }, { type: "single", codes: ["MEDIART 205"] }, { type: "single", codes: ["MEDIART 212"] }, { type: "single", codes: ["LIT 307"] }, { type: "single", codes: ["INFOSCI 305"] }, { type: "single", codes: ["INFOSCI 309"] }, { type: "single", codes: ["MEDIART 312"] }, { type: "single", codes: ["MEDIART 321"] }, { type: "single", codes: ["MEDIART 401"] }],
    },
  },
  {
    major: "Arts and Media",
    track: "Media",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["ARHU 101"] }, { type: "single", codes: ["ARHU 102"] }],
      interdisciplinary: [{ type: "single", codes: ["MEDIART 209"] }, { type: "single", codes: ["MEDIART 490"] }],
      disciplinary: [{ type: "single", codes: ["MEDIA 201"] }, { type: "single", codes: ["MEDIART 211"] }, { type: "single", codes: ["MEDIA 202", "GCULS 201"] }, { type: "single", codes: ["MEDIA 207"] }, { type: "single", codes: ["GLHLTH 202"] }, { type: "single", codes: ["LIT 204", "MEDIA 204"] }, { type: "single", codes: ["INFOSCI 104", "MEDIA 104"] }, { type: "single", codes: ["INFOSCI 201"] }, { type: "single", codes: ["MEDIART 224"] }, { type: "single", codes: ["MEDIART 103"] }, { type: "single", codes: ["MEDIART 212"] }, { type: "single", codes: ["MEDIART 220"] }, { type: "single", codes: ["MEDIART 223"] }, { type: "single", codes: ["MEDIART 301"] }, { type: "single", codes: ["MEDIART 310"] }, { type: "single", codes: ["MEDIART 311"] }, { type: "single", codes: ["MEDIART 498"] }, { type: "single", codes: ["LIT 216"] }, { type: "single", codes: ["MEDIART 104"] }, { type: "single", codes: ["MEDIART 117"] }, { type: "single", codes: ["MEDIART 118"] }, { type: "single", codes: ["MEDIART 198"] }, { type: "single", codes: ["MEDIART 221"] }, { type: "single", codes: ["MEDIART 222"] }, { type: "single", codes: ["LIT 311"] }, { type: "single", codes: ["MEDIART 301"] }, { type: "single", codes: ["MEDIART 322"] }, { type: "single", codes: ["HUM 405", "MEDIART 405"] }, { type: "single", codes: ["INFOSCI 105"] }, { type: "single", codes: ["INFOSCI 202"] }, { type: "single", codes: ["MEDIART 205"] }, { type: "single", codes: ["MEDIART 212"] }, { type: "single", codes: ["LIT 307"] }, { type: "single", codes: ["INFOSCI 305"] }, { type: "single", codes: ["INFOSCI 309"] }, { type: "single", codes: ["MEDIART 312"] }, { type: "single", codes: ["MEDIART 321"] }, { type: "single", codes: ["MEDIART 401"] }],
    },
  },
  {
    major: "Behavioral Science",
    track: "Economics",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["BIOL 110"] }, { type: "single", codes: ["SOSC 101"] }, { type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "single", codes: ["MATH 206"] }, { type: "single", codes: ["STATS 101"] }],
      disciplinary: [{ type: "single", codes: ["ECON 101"] }, { type: "single", codes: ["ECON 201"] }, { type: "single", codes: ["ECON 202"] }, { type: "single", codes: ["ECON 204"] }, { type: "or", options: [] }, { type: "or", options: [["ECON 301"], ["ECON 302"], ["ENVIR 302"], ["ECON 303"], ["ECON 304"], ["ECON 305"], ["ECON 307"], ["ECON 309"], ["ECON 310"], ["ECON 314"], ["ECON 318"], ["ECON 333"]] }],
      electives: [{ type: "single", codes: ["COMPSCI 206"] }, { type: "single", codes: ["ECON 206"] }, { type: "single", codes: ["ECON 211"] }, { type: "single", codes: ["ECON 212"] }, { type: "single", codes: ["ECON 301"] }, { type: "single", codes: ["ECON 302"] }, { type: "single", codes: ["ENVIR 302"] }, { type: "single", codes: ["ECON 310"] }, { type: "single", codes: ["STATS 102"] }, { type: "single", codes: ["COMPSCI 309"] }, { type: "single", codes: ["STATS 304"] }, { type: "single", codes: ["STATS 401"] }, { type: "single", codes: ["STATS 402"] }, { type: "single", codes: ["ECON 303"] }, { type: "single", codes: ["ECON 309"] }, { type: "single", codes: ["MATH 317"] }, { type: "single", codes: ["HIST 225"] }, { type: "single", codes: ["MATH 201"] }, { type: "single", codes: ["MATH 202"] }, { type: "single", codes: ["MATH 206"] }, { type: "single", codes: ["MATH 308"] }],
    },
  },
  {
    major: "Behavioral Science",
    track: "Neuroscience",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["BIOL 110"] }, { type: "single", codes: ["SOSC 101"] }, { type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "single", codes: ["MATH 206"] }, { type: "single", codes: ["STATS 101"] }],
      disciplinary: [{ type: "single", codes: ["NEUROSCI 102"] }, { type: "single", codes: ["BEHAVSCI 205"] }, { type: "single", codes: ["NEUROSCI 212"] }, { type: "single", codes: ["NEUROSCI 301"] }, { type: "single", codes: ["BEHAVSCI 301"] }],
    },
  },
  {
    major: "Behavioral Science",
    track: "Psychology",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["BIOL 110"] }, { type: "single", codes: ["SOSC 101"] }, { type: "single", codes: ["STATS 101"] }, { type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "single", codes: ["MATH 206"] }, { type: "single", codes: ["STATS 101"] }],
      interdisciplinary: [{ type: "single", codes: ["BEHAVSCI 101"] }, { type: "single", codes: ["BEHAVSCI 102"] }, { type: "single", codes: ["BEHAVSCI 201"] }, { type: "single", codes: ["BEHAVSCI 202"] }, { type: "single", codes: ["BEHAVSCI 401"] }],
      disciplinary: [{ type: "single", codes: ["PSYCH 101"] }, { type: "single", codes: ["PSYCH 202"] }, { type: "single", codes: ["PSYCH 203"] }, { type: "single", codes: ["PSYCH 204"] }, { type: "single", codes: ["PSYCH 205"] }],
    },
  },
  {
    major: "Computation and Design",
    track: "Computer Science",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["MATH 206"] }, { type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "or", options: [["BIOL 110"], ["CHEM 110"], ["PHYS 121"]] }],
      interdisciplinary: [{ type: "or", options: [["COMPSCI 101"], ["STATS 102"]] }, { type: "single", codes: ["INFOSCI 102"] }, { type: "single", codes: ["INFOSCI 103"] }, { type: "single", codes: ["INFOSCI 104"] }, { type: "single", codes: ["MEDIA 104"] }, { type: "single", codes: ["STATS 202"] }, { type: "single", codes: ["COMPDSGN 490"] }],
      electives: [{ type: "single", codes: ["ECON 211"] }, { type: "single", codes: ["COMPSCI 309"] }, { type: "single", codes: ["STATS 401"] }, { type: "single", codes: ["STATS 402"] }, { type: "single", codes: ["STATS 403"] }],
    },
  },
  {
    major: "Computation and Design",
    track: "Digital Media",
    categories: {
      divisionalFoundation: [{ type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "or", options: [["ARHU 101"], ["ARHU 102"]] }, { type: "single", codes: ["STATS 101"] }],
      interdisciplinary: [{ type: "or", options: [["COMPSCI 101"], ["STATS 102"]] }, { type: "single", codes: ["INFOSCI 102"] }, { type: "single", codes: ["INFOSCI 103"] }, { type: "single", codes: ["INFOSCI 104"] }, { type: "single", codes: ["MEDIA 104"] }, { type: "single", codes: ["STATS 202"] }, { type: "single", codes: ["COMPDSGN 490"] }],
      disciplinary: [{ type: "single", codes: ["MEDIART 206"] }],
      electives: [{ type: "single", codes: ["INFOSCI 105"] }, { type: "single", codes: ["COMPSCI 201"] }, { type: "single", codes: ["STATS 201"] }, { type: "single", codes: ["GCULS 201"] }, { type: "single", codes: ["CULANTH 202", "MEDIA 202"] }, { type: "single", codes: ["INFOSCI 206"] }, { type: "single", codes: ["COMPSCI 210"] }, { type: "single", codes: ["MEDIART 211"] }, { type: "single", codes: ["POLSCI 302"] }, { type: "single", codes: ["INFOSCI 302"] }, { type: "single", codes: ["LIT 307"] }, { type: "single", codes: ["INFOSCI 308"] }, { type: "single", codes: ["SOSC 314"] }, { type: "single", codes: ["SOSC 315"] }],
    },
  },
  {
    major: "Computation and Design",
    track: "Social Policy",
    categories: {
      divisionalFoundation: [{ type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "single", codes: ["STATS 101"] }, { type: "single", codes: ["SOSC 101"] }],
      interdisciplinary: [{ type: "or", options: [["COMPSCI 101"], ["STATS 102"]] }, { type: "single", codes: ["INFOSCI 102"] }, { type: "single", codes: ["INFOSCI 103"] }, { type: "single", codes: ["INFOSCI 104"] }, { type: "single", codes: ["MEDIA 104"] }, { type: "single", codes: ["STATS 202"] }, { type: "single", codes: ["COMPDSGN 490"] }],
      disciplinary: [{ type: "single", codes: ["STATS 201"] }, { type: "single", codes: ["ECON 206"] }, { type: "single", codes: ["SOSC 314"] }, { type: "single", codes: ["ECON 310"] }, { type: "single", codes: ["SOSC 315"] }, { type: "single", codes: ["SOSC 405"] }, { type: "single", codes: ["ENVIR 101"] }, { type: "single", codes: ["ENVIR 201"] }, { type: "single", codes: ["ENVIR 203"] }, { type: "single", codes: ["ENVIR 206"] }, { type: "single", codes: ["ENVIR 301"] }, { type: "single", codes: ["ECON 302"] }, { type: "single", codes: ["ENVIR 303"] }, { type: "single", codes: ["HIST 111"] }, { type: "single", codes: ["MEDIA 203"] }, { type: "single", codes: ["HIST 212"] }, { type: "single", codes: ["ECON 314"] }, { type: "single", codes: ["SOSC 333"] }],
      electives: [{ type: "single", codes: ["GCULS 106"] }, { type: "single", codes: ["PUBPOL 106"] }, { type: "single", codes: ["HIST 205"] }, { type: "single", codes: ["SOCIOL 206"] }, { type: "single", codes: ["CULSOC 201"] }, { type: "single", codes: ["POLSCI 215"] }, { type: "single", codes: ["GCULS 303"] }, { type: "single", codes: ["POLSCI 307"] }, { type: "single", codes: ["ECON 311"] }, { type: "single", codes: ["ENVIR 401"] }, { type: "single", codes: ["ENVIR 404"] }, { type: "single", codes: ["ECON 404"] }, { type: "single", codes: ["HIST 123"] }, { type: "single", codes: ["POLSCI 314"] }, { type: "single", codes: ["LIT 209"] }, { type: "single", codes: ["ECON 307"] }, { type: "single", codes: ["ECON 333"] }, { type: "single", codes: ["SOSC 333"] }, { type: "single", codes: ["ECON 402"] }],
    },
  },
  {
    major: "Cultures and Societies",
    track: "Cultural Anthropology",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["SOSC 101"] }, { type: "single", codes: ["SOSC 102"] }],
      interdisciplinary: [{ type: "single", codes: ["CULSOC 101"] }, { type: "single", codes: ["CULSOC 205"] }, { type: "single", codes: ["RELIG 205"] }, { type: "single", codes: ["CULSOC 201"] }, { type: "single", codes: ["CULSOC 301"] }, { type: "single", codes: ["CULSOC 390"] }, { type: "single", codes: ["CULSOC 490"] }],
      disciplinary: [{ type: "single", codes: ["CULANTH 101"] }, { type: "single", codes: ["CULANTH 304"] }, { type: "single", codes: ["CULANTH 398"] }, { type: "single", codes: ["POLSCI 314"] }, { type: "single", codes: ["GCHINA 305"] }],
      electives: [{ type: "single", codes: ["CULANTH 107"] }, { type: "single", codes: ["CULMOVE 115"] }, { type: "single", codes: ["CULANTH 106"] }, { type: "single", codes: ["RELIG 206"] }, { type: "single", codes: ["CULANTH 202"] }, { type: "single", codes: ["MEDIA 202"] }, { type: "single", codes: ["CULANTH 207"] }, { type: "single", codes: ["MEDIA 207"] }, { type: "single", codes: ["SOCIOL 101"] }, { type: "single", codes: ["SOCIOL 202"] }, { type: "single", codes: ["SOCIOL 305"] }, { type: "single", codes: ["HIST 228"] }, { type: "single", codes: ["GCHINA 204"] }, { type: "single", codes: ["HUM 405"] }, { type: "single", codes: ["MEDIART 405"] }, { type: "single", codes: ["CULANTH 298"] }, { type: "single", codes: ["PHIL 309"] }, { type: "single", codes: ["POLECON 301"] }],
    },
  },
  {
    major: "Cultures and Societies",
    track: "Sociology",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["SOSC 101"] }, { type: "single", codes: ["SOSC 102"] }],
      interdisciplinary: [{ type: "single", codes: ["CULSOC 101"] }, { type: "single", codes: ["CULSOC 205"] }, { type: "single", codes: ["RELIG 205"] }, { type: "single", codes: ["CULSOC 201"] }, { type: "single", codes: ["CULSOC 301"] }, { type: "single", codes: ["CULSOC 390"] }, { type: "single", codes: ["CULSOC 490"] }],
      disciplinary: [{ type: "single", codes: ["SOCIOL 101"] }, { type: "single", codes: ["STATS 101"] }, { type: "single", codes: ["SOCIOL 305"] }, { type: "single", codes: ["SOSC 206"] }, { type: "single", codes: ["SOSC 314"] }, { type: "single", codes: ["SOCIOL 202"] }, { type: "single", codes: ["SOCIOL 213"] }, { type: "single", codes: ["SOCIOL 223"] }, { type: "single", codes: ["PUBPOL 223"] }, { type: "single", codes: ["SOCIOL 310"] }, { type: "single", codes: ["SOSC 315"] }, { type: "single", codes: ["SOCIOL 380"] }],
      electives: [{ type: "single", codes: ["SOCIOL 298"] }, { type: "single", codes: ["POLSCI 314"] }, { type: "single", codes: ["SOSC 333"] }, { type: "single", codes: ["GLHLTH 205"] }, { type: "single", codes: ["HIST 110"] }, { type: "single", codes: ["PUBPOL 204"] }, { type: "single", codes: ["CULANTH 304"] }, { type: "single", codes: ["GCHINA 305"] }, { type: "single", codes: ["POLSCI 308"] }, { type: "single", codes: ["GLHLTH 303"] }, { type: "single", codes: ["GLHLTH 304"] }, { type: "single", codes: ["MEDIA 203"] }, { type: "single", codes: ["MEDIART 208"] }, { type: "single", codes: ["POLSCI 104"] }, { type: "single", codes: ["POLSCI 317"] }, { type: "single", codes: ["GCHINA 205"] }, { type: "single", codes: ["GCHINA 204"] }, { type: "single", codes: ["ARTS 203"] }, { type: "single", codes: ["ARTS 210"] }, { type: "single", codes: ["RELIG 201"] }, { type: "single", codes: ["RELIG 301"] }, { type: "single", codes: ["RELIG 302"] }, { type: "single", codes: ["PHIL 309"] }],
    },
  },
  {
    major: "Data Science",
    track: null,
    categories: {
      divisionalFoundation: [{ type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "single", codes: ["PHYS 121"] }, { type: "single", codes: ["BIOL 110"] }, { type: "single", codes: ["CHEM 110"] }, { type: "single", codes: ["PHYS 121"] }, { type: "single", codes: ["INTGSCI 205"] }],
      interdisciplinary: [{ type: "single", codes: ["COMPSCI 309"] }, { type: "single", codes: ["STATS 303"] }, { type: "single", codes: ["STATS 401"] }, { type: "single", codes: ["STATS 402"] }],
      disciplinary: [{ type: "single", codes: ["MATH 201"] }, { type: "single", codes: ["MATH 202"] }, { type: "single", codes: ["MATH 206"] }, { type: "single", codes: ["STATS 211"] }, { type: "single", codes: ["MATH 304"] }, { type: "single", codes: ["MATH 305"] }],
      electives: [{ type: "single", codes: ["COMPSCI 101"] }, { type: "single", codes: ["COMPSCI 203"] }, { type: "single", codes: ["COMPSCI 205"] }, { type: "single", codes: ["COMPSCI 303"] }, { type: "single", codes: ["COMPSCI 306"] }, { type: "single", codes: ["COMPSCI 308"] }, { type: "single", codes: ["COMPSCI 310"] }, { type: "single", codes: ["COMPSCI 311"] }, { type: "single", codes: ["COMPSCI 320"] }, { type: "single", codes: ["COMPSCI 401"] }, { type: "single", codes: ["STATS 102"] }, { type: "single", codes: ["STATS 304"] }, { type: "single", codes: ["COMPSCI 402"] }, { type: "single", codes: ["STATS 403"] }, { type: "single", codes: ["STATS 404"] }, { type: "single", codes: ["COMPSCI 207"] }, { type: "single", codes: ["COMPSCI 302"] }, { type: "single", codes: ["COMPSCI 304"] }, { type: "single", codes: ["ECON 211"] }],
    },
  },
  {
    major: "Environmental Science",
    track: "Biogeochemistry",
    categories: {
      divisionalFoundation: [{ type: "or", options: [["MATH 101"], ["MATH 105"]] }],
      interdisciplinary: [{ type: "single", codes: ["ENVIR 101"] }, { type: "single", codes: ["ENVIR 102"] }, { type: "single", codes: ["ENVIR 201"] }, { type: "or", options: [["ENVIR 304"], ["ENVIR 202"]] }, { type: "or", options: [["ECON 302"], ["ENVIR 301"]] }],
      disciplinary: [{ type: "single", codes: ["BIOL 208"] }, { type: "single", codes: ["BIOL 311"] }, { type: "or", options: [["STATS 101"], ["MATH 206"]] }, { type: "or", options: [["BIOL 312"], ["ENVIR 315"]] }, { type: "or", options: [["BIOL 313"], ["BIOL 319"], ["BIOL 405"]] }],
      electives: [{ type: "single", codes: ["BIOL 318"] }, { type: "single", codes: ["BIOL 405"] }, { type: "single", codes: ["ENVIR 202"] }, { type: "single", codes: ["BIOL 312"] }, { type: "single", codes: ["ENVIR 310"] }, { type: "single", codes: ["ENVIR 306"] }, { type: "single", codes: ["ENVIR 315"] }, { type: "single", codes: ["CHEM 315"] }, { type: "single", codes: ["BIOL 319"] }, { type: "single", codes: ["ENVIR 310"] }, { type: "single", codes: ["ENVIR 303"] }, { type: "single", codes: ["PUBPOL 308"] }, { type: "single", codes: ["SOSC 204"] }, { type: "single", codes: ["INFOSCI 302"] }, { type: "single", codes: ["BIOL 314"] }, { type: "single", codes: ["INTGSCI 205"] }],
    },
  },
  {
    major: "Environmental Science",
    track: "Biology",
    categories: {
      divisionalFoundation: [{ type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "single", codes: ["BIOL 110"] }, { type: "single", codes: ["CHEM 110"] }, { type: "single", codes: ["PHYS 121"] }],
      interdisciplinary: [{ type: "single", codes: ["ENVIR 101"] }, { type: "single", codes: ["ENVIR 102"] }, { type: "single", codes: ["ENVIR 201"] }, { type: "or", options: [["ENVIR 304"], ["ENVIR 202"]] }, { type: "or", options: [["ENVIR 302"], ["ENVIR 301"]] }],
      disciplinary: [{ type: "single", codes: ["BIOL 201"] }, { type: "single", codes: ["CHEM 201"] }, { type: "single", codes: ["BIOL 208"] }, { type: "single", codes: ["BIOL 212"] }, { type: "single", codes: ["BIOL 202"] }, { type: "single", codes: ["BIOL 305"] }, { type: "or", options: [["STATS 101"], ["MATH 206"]] }],
      electives: [{ type: "single", codes: ["BIOL 203"] }, { type: "single", codes: ["GCULS 203"] }, { type: "single", codes: ["SOSC 204"] }, { type: "single", codes: ["GLHLTH 301"] }, { type: "single", codes: ["INFOSCI 302"] }, { type: "single", codes: ["GLHLTH 306"] }, { type: "single", codes: ["ENVIR 306"] }, { type: "single", codes: ["BIOL 308"] }, { type: "single", codes: ["BIOL 310"] }, { type: "single", codes: ["BIOL 314"] }, { type: "single", codes: ["PUBPOL 317"] }, { type: "single", codes: ["ENVIR 404"] }, { type: "single", codes: ["ECON 404"] }, { type: "single", codes: ["BIOL 409"] }, { type: "single", codes: ["GLHLTH 409"] }, { type: "single", codes: ["BIOL 410"] }, { type: "single", codes: ["GLHLTH 410"] }, { type: "single", codes: ["BIOL 411"] }, { type: "single", codes: ["GLHLTH 411"] }, { type: "single", codes: ["INTGSCI 205"] }],
    },
  },
  {
    major: "Environmental Science",
    track: "Chemistry",
    categories: {
      divisionalFoundation: [{ type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "single", codes: ["BIOL 110"] }, { type: "single", codes: ["CHEM 110"] }, { type: "single", codes: ["PHYS 121"] }],
      interdisciplinary: [{ type: "single", codes: ["ENVIR 101"] }, { type: "single", codes: ["ENVIR 102"] }, { type: "single", codes: ["ENVIR 201"] }, { type: "or", options: [["ENVIR 304"], ["ENVIR 202"]] }, { type: "or", options: [["ENVIR 302"], ["ECON 302"]] }, { type: "single", codes: ["ENVIR 301"] }],
      disciplinary: [{ type: "single", codes: ["PHYS 122"] }, { type: "single", codes: ["CHEM 150"] }, { type: "single", codes: ["MATH 201"] }, { type: "single", codes: ["CHEM 201"] }, { type: "single", codes: ["CHEM 202"] }, { type: "single", codes: ["CHEM 301"] }, { type: "single", codes: ["CHEM 401"] }, { type: "single", codes: ["CHEM 402"] }],
      electives: [{ type: "single", codes: ["ENVIR 306"] }, { type: "single", codes: ["ENVIR 311"] }, { type: "single", codes: ["BIOL 311"] }, { type: "single", codes: ["ENVIR 402"] }, { type: "single", codes: ["ENVIR 315"] }, { type: "single", codes: ["CHEM 315"] }, { type: "single", codes: ["ENVIR 203"] }, { type: "single", codes: ["SOSC 204"] }, { type: "single", codes: ["ENVIR 303"] }, { type: "single", codes: ["PUBPOL 317"] }, { type: "single", codes: ["ENVIR 313"] }, { type: "single", codes: ["BIOL 313"] }, { type: "single", codes: ["ENVIR 404"] }, { type: "single", codes: ["ECON 404"] }, { type: "single", codes: ["CHEM 403"] }, { type: "single", codes: ["INTGSCI 205"] }],
    },
  },
  {
    major: "Environmental Science",
    track: "Public Policy",
    categories: {
      divisionalFoundation: [{ type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "single", codes: ["SOSC 101"] }, { type: "single", codes: ["SOSC 102"] }, { type: "single", codes: ["BIOL 110"] }, { type: "single", codes: ["CHEM 110"] }],
      interdisciplinary: [{ type: "single", codes: ["ENVIR 101"] }, { type: "single", codes: ["ENVIR 102"] }, { type: "single", codes: ["ENVIR 201"] }, { type: "or", options: [["ENVIR 304"], ["ENVIR 202"]] }, { type: "or", options: [["ENVIR 302"], ["ECON 302"]] }, { type: "single", codes: ["ENVIR 301"] }],
      disciplinary: [{ type: "single", codes: ["STATS 101"] }, { type: "single", codes: ["PUBPOL 101"] }, { type: "single", codes: ["PUBPOL 301"] }, { type: "single", codes: ["PUBPOL 303"] }, { type: "single", codes: ["ECON 201"] }, { type: "single", codes: ["PUBPOL 205"] }],
      electives: [{ type: "single", codes: ["ENVIR 206"] }, { type: "single", codes: ["PUBPOL 201"] }, { type: "single", codes: ["ENVIR 303"] }, { type: "single", codes: ["ENVIR 403"] }, { type: "single", codes: ["GCULS 108"] }, { type: "single", codes: ["HIST 123"] }, { type: "single", codes: ["SOSC 204"] }, { type: "single", codes: ["PUBPOL 209"] }, { type: "single", codes: ["PUBPOL 220"] }, { type: "single", codes: ["PUBPOL 318"] }, { type: "single", codes: ["HIST 316"] }, { type: "single", codes: ["PUBPOL 316"] }, { type: "single", codes: ["ENVIR 404"] }, { type: "single", codes: ["ECON 404"] }, { type: "single", codes: ["PUBPOL 202"] }, { type: "single", codes: ["ENVIR 204"] }, { type: "single", codes: ["ENVIR 305"] }, { type: "single", codes: ["POLSCI 317"] }, { type: "single", codes: ["SOSC 317"] }, { type: "single", codes: ["ENVIR 306"] }, { type: "single", codes: ["PUBPOL 308"] }, { type: "single", codes: ["PUBPOL 317"] }, { type: "single", codes: ["ENVIR 203"] }, { type: "single", codes: ["WOC 206"] }, { type: "single", codes: ["INFOSCI 302"] }],
    },
  },
  {
    major: "Global China Studies",
    track: null,
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["SOSC 101"] }, { type: "single", codes: ["ARHU 101"] }],
      interdisciplinary: [{ type: "single", codes: ["GCHINA 108"] }, { type: "single", codes: ["GCHINA 205"] }, { type: "single", codes: ["GCHINA 305"] }, { type: "single", codes: ["GCHINA 390"] }, { type: "single", codes: ["GCHINA 490"] }],
      disciplinary: [{ type: "single", codes: ["GCHINA 202"] }, { type: "single", codes: ["GCHINA 304"] }, { type: "single", codes: ["GCHINA 306"] }, { type: "single", codes: ["CHINESE 402A"] }, { type: "single", codes: ["CHINESE 402B"] }, { type: "or", options: [["HIST 201"], ["SOSC 102"], ["SOSC 206"], ["STATS 101"], ["CHINESE 402B"], ["HIST 217"], ["MEDIART 208"], ["POLSCI 303"], ["POLSCI 316"], ["GCHINA 301"], ["HIST 22"], ["HIST 301"], ["RELIG 302"], ["GCHINA 204"], ["GCHINA 206"], ["HIST 205"], ["LIT 310"]] }],
    },
  },
  {
    major: "Global Health",
    track: "Biology",
    categories: {
      divisionalFoundation: [{ type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "single", codes: ["BIOL 110"] }, { type: "single", codes: ["CHEM 110"] }, { type: "single", codes: ["PHYS 121"] }],
      interdisciplinary: [{ type: "single", codes: ["GLHLTH 101"] }, { type: "single", codes: ["GLHLTH 201"] }, { type: "single", codes: ["GLHLTH 205"] }, { type: "or", options: [["GLHLTH 310"], ["GLHLTH 303"], ["GLHLTH 304"]] }, { type: "or", options: [["GLHLTH 280"], ["GLHLTH 305"], ["GLHLTH 306"], ["GLHLTH 307"]] }],
      disciplinary: [{ type: "single", codes: ["CHEM 201"] }, { type: "single", codes: ["BIOL 201"] }, { type: "single", codes: ["BIOL 202"] }, { type: "single", codes: ["BIOL 208"] }, { type: "single", codes: ["BIOL 212"] }, { type: "single", codes: ["BIOL 305"] }, { type: "or", options: [["STATS 101"], ["MATH 206"]] }],
      electives: [{ type: "single", codes: ["GLHLTH 301"] }, { type: "single", codes: ["GLHLTH 301"] }, { type: "single", codes: ["GLHLTH 311"] }, { type: "single", codes: ["BIOL 203"] }, { type: "single", codes: ["GCULS 203"] }, { type: "single", codes: ["BIOL 308"] }, { type: "single", codes: ["HIST 212"] }, { type: "single", codes: ["INTGSCI 205"] }, { type: "single", codes: ["GLHLTH 301"] }, { type: "single", codes: ["BIOL 306"] }, { type: "single", codes: ["BIOL 307"] }, { type: "single", codes: ["BIOL 308"] }, { type: "single", codes: ["BIOL 310"] }, { type: "single", codes: ["BIOL 321"] }, { type: "single", codes: ["BIOL 409"] }, { type: "single", codes: ["GLHLTH 409"] }, { type: "single", codes: ["BIOL 410"] }, { type: "single", codes: ["GLHLTH 410"] }, { type: "single", codes: ["BIOL 411"] }, { type: "single", codes: ["GLHLTH 411"] }, { type: "single", codes: ["GLHLTH 202"] }, { type: "single", codes: ["GLHLTH 301"] }, { type: "single", codes: ["GLHLTH 312"] }, { type: "single", codes: ["PUBPOL 220"] }, { type: "single", codes: ["PUBPOL 318"] }, { type: "single", codes: ["GLHLTH 301"] }, { type: "single", codes: ["CULANTH 303"] }, { type: "single", codes: ["ECON 301"] }, { type: "single", codes: ["GCULS 301"] }, { type: "single", codes: ["ETHLDR 206"] }, { type: "single", codes: ["BIOL 320"] }, { type: "single", codes: ["ENVIR 101"] }, { type: "single", codes: ["GLHLTH 280"] }, { type: "single", codes: ["ETHLDR 204"] }, { type: "single", codes: ["ENVIR 204"] }, { type: "single", codes: ["ENVIR 304"] }, { type: "single", codes: ["ENVIR 402"] }, { type: "single", codes: ["ENVIR 306"] }, { type: "single", codes: ["PUBPOL 317"] }],
    },
  },
  {
    major: "Global Health",
    track: "Public Policy",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["SOSC 101"] }, { type: "single", codes: ["SOSC 102"] }, { type: "single", codes: ["BIOL 110"] }, { type: "or", options: [["MATH 101"], ["MATH 105"]] }],
      interdisciplinary: [{ type: "single", codes: ["GLHLTH 101"] }, { type: "single", codes: ["GLHLTH 201"] }, { type: "single", codes: ["GLHLTH 205"] }, { type: "or", options: [["GLHLTH 310"], ["GLHLTH 303"], ["GLHLTH 304"]] }, { type: "or", options: [["GLHLTH 280"], ["GLHLTH 305"], ["GLHLTH 306"], ["GLHLTH 307"]] }],
      disciplinary: [{ type: "single", codes: ["STATS 101"] }, { type: "single", codes: ["PUBPOL 101"] }, { type: "single", codes: ["PUBPOL 301"] }, { type: "single", codes: ["PUBPOL 303"] }, { type: "single", codes: ["ECON 201"] }, { type: "single", codes: ["PUBPOL 205"] }],
      electives: [{ type: "single", codes: ["GLHLTH 301"] }, { type: "single", codes: ["GLHLTH 301"] }, { type: "single", codes: ["GLHLTH 311"] }, { type: "single", codes: ["GLHLTH 312"] }, { type: "single", codes: ["INFOSCI 302"] }, { type: "single", codes: ["BIOL 203"] }, { type: "single", codes: ["GCULS 203"] }, { type: "single", codes: ["BIOL 308"] }, { type: "single", codes: ["HIST 212"] }, { type: "single", codes: ["INTGSCI 205"] }, { type: "single", codes: ["GLHLTH 301"] }, { type: "single", codes: ["BIOL 306"] }, { type: "single", codes: ["BIOL 307"] }, { type: "single", codes: ["BIOL 308"] }, { type: "single", codes: ["BIOL 310"] }, { type: "single", codes: ["BIOL 410"] }, { type: "single", codes: ["GLHLTH 410"] }, { type: "single", codes: ["BIOL 411"] }, { type: "single", codes: ["GLHLTH 411"] }, { type: "single", codes: ["GLHLTH 301"] }, { type: "single", codes: ["GLHLTH 202"] }, { type: "single", codes: ["PUBPOL 220"] }, { type: "single", codes: ["PUBPOL 318"] }, { type: "single", codes: ["GLHLTH 301"] }, { type: "single", codes: ["CULANTH 303"] }, { type: "single", codes: ["ECON 301"] }, { type: "single", codes: ["GCULS 301"] }, { type: "single", codes: ["ETHLDR 206"] }, { type: "single", codes: ["BIOL 320"] }, { type: "single", codes: ["ENVIR 101"] }, { type: "single", codes: ["GLHLTH 280"] }, { type: "single", codes: ["ETHLDR 204"] }, { type: "single", codes: ["ENVIR 204"] }, { type: "single", codes: ["ENVIR 304"] }, { type: "single", codes: ["ENVIR 402"] }, { type: "single", codes: ["ENVIR 306"] }, { type: "single", codes: ["PUBPOL 317"] }],
    },
  },
  {
    major: "Humanities",
    track: "Creative Writing and Translation",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["ARHU 101"] }, { type: "single", codes: ["ARHU 102"] }],
      interdisciplinary: [{ type: "single", codes: ["HUM 301"] }, { type: "single", codes: ["HUM 490"] }],
      disciplinary: [{ type: "single", codes: ["LIT 216"] }, { type: "single", codes: ["LIT 219"] }, { type: "single", codes: ["MEDIART 219"] }, { type: "single", codes: ["LIT 310"] }, { type: "single", codes: ["LIT 315"] }, { type: "single", codes: ["WOC 207"] }, { type: "single", codes: ["CHINESE 408"] }, { type: "single", codes: ["WOC 210"] }, { type: "single", codes: ["WOC 213"] }, { type: "single", codes: ["WOC 216"] }, { type: "single", codes: ["WOC 217"] }, { type: "single", codes: ["HUM 405"] }, { type: "single", codes: ["MEDIART 405"] }, { type: "single", codes: ["LIT 220"] }, { type: "single", codes: ["LIT 311"] }, { type: "single", codes: ["LIT 314"] }, { type: "single", codes: ["MEDIART 110"] }, { type: "single", codes: ["MEDIART 207"] }, { type: "single", codes: ["MEDIART 310"] }, { type: "single", codes: ["WOC 108"] }, { type: "single", codes: ["WOC 190"] }, { type: "single", codes: ["WOC 214"] }, { type: "single", codes: ["CHINESE 414"] }, { type: "single", codes: ["WOC 290"] }, { type: "single", codes: ["HIST 314"] }],
    },
  },
  {
    major: "Humanities",
    track: "Literature",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["ARHU 101"] }, { type: "single", codes: ["ARHU 102"] }],
      interdisciplinary: [{ type: "single", codes: ["HUM 301"] }, { type: "single", codes: ["HUM 490"] }],
      disciplinary: [{ type: "single", codes: ["LIT 214"] }, { type: "single", codes: ["LIT 298"] }, { type: "single", codes: ["LIT 298"] }, { type: "single", codes: ["LIT 216"] }, { type: "single", codes: ["LIT 223"] }, { type: "single", codes: ["LIT 311"] }, { type: "single", codes: ["LIT 314"] }, { type: "single", codes: ["LIT 310"] }, { type: "single", codes: ["LIT 203"] }, { type: "single", codes: ["LIT 210"] }, { type: "single", codes: ["LIT 221"] }, { type: "single", codes: ["LIT 398"] }, { type: "single", codes: ["LIT 315"] }, { type: "single", codes: ["HUM 405"] }, { type: "single", codes: ["MEDIART 405"] }],
    },
  },
  {
    major: "Humanities",
    track: "Philosophy and Religion",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["ARHU 101"] }, { type: "single", codes: ["ARHU 102"] }],
      interdisciplinary: [{ type: "single", codes: ["HUM 301"] }, { type: "single", codes: ["HUM 490"] }],
      disciplinary: [{ type: "single", codes: ["HUM 201"] }, { type: "single", codes: ["HIST 226"] }, { type: "single", codes: ["HIST 233"] }, { type: "single", codes: ["RELIG 302"] }, { type: "single", codes: ["RELIG 221"] }, { type: "single", codes: ["PHIL 305"] }, { type: "single", codes: ["PHIL 398"] }, { type: "single", codes: ["RELIG 398"] }],
    },
  },
  {
    major: "Humanities",
    track: "World History",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["ARHU 101"] }, { type: "single", codes: ["ARHU 102"] }],
      disciplinary: [{ type: "single", codes: ["HIST 201"] }, { type: "single", codes: ["HIST 111"] }, { type: "single", codes: ["HIST 228"] }, { type: "single", codes: ["RELIG 203"] }, { type: "single", codes: ["HIST 309"] }, { type: "single", codes: ["HIST 401"] }, { type: "single", codes: ["HIST 227"] }, { type: "single", codes: ["HIST 229"] }, { type: "single", codes: ["HIST 230"] }, { type: "single", codes: ["HIST 314"] }, { type: "single", codes: ["HIST 217"] }, { type: "single", codes: ["HIST 402"] }],
    },
  },
  {
    major: "Materials Science",
    track: "Chemistry",
    categories: {
      divisionalFoundation: [{ type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "single", codes: ["BIOL 110"] }, { type: "single", codes: ["CHEM 110"] }, { type: "single", codes: ["PHYS 121"] }],
      interdisciplinary: [{ type: "single", codes: ["CHEM 201"] }, { type: "single", codes: ["MATSCI 201"] }, { type: "single", codes: ["MATSCI 301"] }, { type: "single", codes: ["MATSCI 302"] }, { type: "single", codes: ["MATSCI 401"] }],
      disciplinary: [{ type: "single", codes: ["PHYS 122"] }, { type: "single", codes: ["CHEM 150"] }, { type: "single", codes: ["MATH 201"] }, { type: "single", codes: ["CHEM 202"] }, { type: "single", codes: ["CHEM 301"] }, { type: "single", codes: ["CHEM 401"] }, { type: "single", codes: ["CHEM 402"] }],
      electives: [{ type: "single", codes: ["MATSCI 101"] }, { type: "single", codes: ["INTGSCI 205"] }, { type: "single", codes: ["CHEM 403"] }, { type: "single", codes: ["ENVIR 304"] }, { type: "single", codes: ["CHEM 315"] }, { type: "single", codes: ["ENVIR 315"] }, { type: "single", codes: ["ENVIR 402"] }, { type: "single", codes: ["MATSCI 303"] }, { type: "single", codes: ["MATSCI 402"] }, { type: "single", codes: ["PHYS 402"] }, { type: "single", codes: ["PHYS 310"] }, { type: "single", codes: ["MATSCI 403"] }, { type: "single", codes: ["MATSCI 404"] }, { type: "single", codes: ["PHYS 408"] }, { type: "single", codes: ["CHEM 410"] }],
    },
  },
  {
    major: "Materials Science",
    track: "Physics",
    categories: {
      divisionalFoundation: [{ type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "single", codes: ["BIOL 110"] }, { type: "single", codes: ["CHEM 110"] }, { type: "single", codes: ["PHYS 121"] }],
      interdisciplinary: [{ type: "single", codes: ["CHEM 201"] }, { type: "single", codes: ["MATSCI 201"] }, { type: "single", codes: ["MATSCI 301"] }, { type: "single", codes: ["MATSCI 302"] }, { type: "single", codes: ["MATSCI 401"] }],
      disciplinary: [{ type: "single", codes: ["PHYS 122"] }, { type: "single", codes: ["MATH 201"] }, { type: "single", codes: ["PHYS 201"] }, { type: "single", codes: ["MATH 202"] }, { type: "single", codes: ["PHYS 302"] }, { type: "single", codes: ["PHYS 405"] }, { type: "single", codes: ["PHYS 301"] }, { type: "single", codes: ["PHYS 304"] }, { type: "single", codes: ["PHYS 306"] }],
      electives: [{ type: "single", codes: ["MATSCI 101"] }, { type: "single", codes: ["INTGSCI 205"] }, { type: "single", codes: ["PHYS 101"] }, { type: "single", codes: ["PHYS 105"] }, { type: "single", codes: ["ARTS 105"] }, { type: "single", codes: ["PHYS 134"] }, { type: "single", codes: ["PHYS 403"] }, { type: "single", codes: ["COMPSCI 201"] }, { type: "single", codes: ["MATSCI 202"] }, { type: "single", codes: ["MATH 206"] }, { type: "single", codes: ["MATH 303"] }, { type: "single", codes: ["PHYS 404"] }, { type: "single", codes: ["PHYS 408"] }, { type: "single", codes: ["MATSCI 303"] }, { type: "single", codes: ["PHYS 310"] }, { type: "single", codes: ["MATSCI 402"] }, { type: "single", codes: ["PHYS 402"] }, { type: "single", codes: ["MATSCI 403"] }, { type: "single", codes: ["MATSCI 404"] }],
    },
  },
  {
    major: "Molecular Bioscience",
    track: "Biogeochemistry",
    categories: {
      divisionalFoundation: [{ type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "single", codes: ["BIOL 110"] }, { type: "single", codes: ["CHEM 110"] }, { type: "single", codes: ["PHYS 121"] }],
      interdisciplinary: [{ type: "single", codes: ["CHEM 201"] }, { type: "single", codes: ["PHYS 303"] }, { type: "single", codes: ["BIOL 305"] }, { type: "single", codes: ["BIOL 320"] }, { type: "single", codes: ["BIOL 201"] }, { type: "single", codes: ["BIOL 202"] }],
      disciplinary: [{ type: "single", codes: ["ENVIR 102"] }, { type: "single", codes: ["BIOL 208"] }, { type: "single", codes: ["BIOL 311"] }, { type: "single", codes: ["ENVIR 311"] }, { type: "single", codes: ["STATS 101"] }, { type: "single", codes: ["MATH 206"] }, { type: "single", codes: ["BIOL 212"] }, { type: "single", codes: ["BIOL 313"] }, { type: "single", codes: ["ENVIR 313"] }, { type: "single", codes: ["BIOL 319"] }, { type: "single", codes: ["CHEM 150"] }, { type: "single", codes: ["BIOL 312"] }, { type: "single", codes: ["ENVIR 315"] }, { type: "single", codes: ["CHEM 315"] }],
      electives: [{ type: "single", codes: ["BIOL 318"] }, { type: "single", codes: ["BIOL 405"] }, { type: "single", codes: ["ENVIR 102"] }, { type: "single", codes: ["ENVIR 202"] }, { type: "single", codes: ["ENVIR 304"] }],
    },
  },
  {
    major: "Molecular Bioscience",
    track: "Biophysics",
    categories: {
      divisionalFoundation: [{ type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "single", codes: ["BIOL 110"] }, { type: "single", codes: ["CHEM 110"] }, { type: "single", codes: ["PHYS 121"] }],
      interdisciplinary: [{ type: "single", codes: ["CHEM 201"] }, { type: "single", codes: ["PHYS 303"] }, { type: "single", codes: ["BIOL 305"] }, { type: "single", codes: ["BIOL 320"] }, { type: "single", codes: ["BIOL 201"] }, { type: "single", codes: ["BIOL 202"] }],
      disciplinary: [{ type: "single", codes: ["PHYS 122"] }, { type: "single", codes: ["MATH 201"] }, { type: "single", codes: ["PHYS 201"] }, { type: "single", codes: ["MATH 202"] }, { type: "single", codes: ["PHYS 302"] }, { type: "single", codes: ["PHYS 406"] }, { type: "single", codes: ["PHYS 301"] }, { type: "single", codes: ["PHYS 304"] }, { type: "single", codes: ["PHYS 306"] }, { type: "single", codes: ["PHYS 404"] }],
      electives: [{ type: "single", codes: ["BIOL 316"] }, { type: "single", codes: ["MATH 303"] }, { type: "single", codes: ["PHYS 310"] }, { type: "single", codes: ["MATH 403"] }, { type: "single", codes: ["MATH 410"] }, { type: "single", codes: ["CHEM 404"] }],
    },
  },
  {
    major: "Molecular Bioscience",
    track: "Cell and Molecular Biology",
    categories: {
      divisionalFoundation: [{ type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "single", codes: ["BIOL 110"] }, { type: "single", codes: ["CHEM 110"] }, { type: "single", codes: ["PHYS 121"] }],
      interdisciplinary: [{ type: "single", codes: ["CHEM 201"] }, { type: "single", codes: ["BIOL 202"] }, { type: "single", codes: ["PHYS 303"] }, { type: "single", codes: ["BIOL 305"] }, { type: "single", codes: ["BIOL 320"] }],
      disciplinary: [{ type: "single", codes: ["BIOL 201"] }, { type: "single", codes: ["BIOL 212"] }, { type: "single", codes: ["BIOL 304"] }, { type: "single", codes: ["BIOL 306"] }, { type: "single", codes: ["BIOL 315"] }, { type: "single", codes: ["BIOL 321"] }, { type: "or", options: [["STATS 101"], ["MATH 206"]] }],
      electives: [{ type: "single", codes: ["INTGSCI 205"] }, { type: "single", codes: ["BIOL 203"] }, { type: "single", codes: ["BIOL 307"] }, { type: "single", codes: ["BIOL 310"] }, { type: "single", codes: ["BIOL 314"] }, { type: "single", codes: ["BIOL 317"] }, { type: "single", codes: ["BIOL 401"] }, { type: "single", codes: ["BIOL 409"] }, { type: "single", codes: ["GLHLTH 409"] }, { type: "single", codes: ["BIOL 410"] }, { type: "single", codes: ["GLHLTH 410"] }, { type: "single", codes: ["BIOL 314"] }, { type: "single", codes: ["CHEM 404"] }, { type: "single", codes: ["NEUROSCI 102"] }, { type: "single", codes: ["NEUROSCI 202"] }],
    },
  },
  {
    major: "Molecular Bioscience",
    track: "Genetics and Genomics",
    categories: {
      divisionalFoundation: [{ type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "single", codes: ["BIOL 110"] }, { type: "single", codes: ["CHEM 110"] }, { type: "single", codes: ["PHYS 121"] }],
      interdisciplinary: [{ type: "single", codes: ["CHEM 201"] }, { type: "single", codes: ["BIOL 202"] }, { type: "single", codes: ["PHYS 303"] }, { type: "single", codes: ["BIOL 305"] }, { type: "single", codes: ["BIOL 320"] }],
      disciplinary: [{ type: "single", codes: ["BIOL 201"] }, { type: "single", codes: ["BIOL 304"] }, { type: "single", codes: ["BIOL 314"] }, { type: "single", codes: ["BIOL 321"] }, { type: "single", codes: ["BIOL 403"] }, { type: "single", codes: ["BIOL 407"] }, { type: "or", options: [["STATS 101"], ["MATH 206"]] }],
      electives: [{ type: "single", codes: ["INTGSCI 205"] }, { type: "single", codes: ["BIOL 203"] }, { type: "single", codes: ["BIOL 212"] }, { type: "single", codes: ["NEUROSCI 301"] }, { type: "single", codes: ["BIOL 310"] }, { type: "single", codes: ["BIOL 315"] }, { type: "single", codes: ["BIOL 317"] }, { type: "single", codes: ["BIOL 404"] }, { type: "single", codes: ["BIOL 409"] }, { type: "single", codes: ["GLHLTH 409"] }, { type: "single", codes: ["BIOL 314"] }, { type: "single", codes: ["ENVIR 202"] }],
    },
  },
  {
    major: "Molecular Bioscience",
    track: "Neuroscience",
    categories: {
      divisionalFoundation: [{ type: "or", options: [["MATH 101"], ["MATH 105"]] }, { type: "single", codes: ["BIOL 110"] }, { type: "single", codes: ["CHEM 110"] }, { type: "single", codes: ["PHYS 121"] }],
      interdisciplinary: [{ type: "single", codes: ["CHEM 201"] }, { type: "single", codes: ["BIOL 202"] }, { type: "single", codes: ["PHYS 303"] }, { type: "single", codes: ["BIOL 305"] }, { type: "single", codes: ["BIOL 320"] }],
      disciplinary: [{ type: "single", codes: ["NEUROSCI 102"] }, { type: "single", codes: ["BEHAVSCI 205"] }, { type: "single", codes: ["NEUROSCI 212"] }, { type: "single", codes: ["NEUROSCI 301"] }, { type: "single", codes: ["BEHAVSCI 301"] }],
      electives: [{ type: "single", codes: ["INTGSCI 205"] }, { type: "single", codes: ["BIOL 203"] }, { type: "single", codes: ["BIOL 307"] }, { type: "single", codes: ["BIOL 310"] }, { type: "single", codes: ["BIOL 314"] }, { type: "single", codes: ["BIOL 317"] }, { type: "single", codes: ["BIOL 401"] }, { type: "single", codes: ["BIOL 409"] }, { type: "single", codes: ["GLHLTH 409"] }, { type: "single", codes: ["BIOL 410"] }, { type: "single", codes: ["GLHLTH 410"] }, { type: "single", codes: ["BIOL 411"] }, { type: "single", codes: ["GLHLTH 411"] }, { type: "single", codes: ["BIOL 314"] }, { type: "single", codes: ["CHEM 404"] }],
    },
  },
  {
    major: "Philosophy, Politics, and Economics",
    track: "Economic History",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["SOSC 101"] }, { type: "single", codes: ["SOSC 102"] }, { type: "single", codes: ["STATS 101"] }],
      interdisciplinary: [{ type: "single", codes: ["PPE 101"] }, { type: "single", codes: ["ECON 101"] }, { type: "single", codes: ["ECON 201"] }, { type: "single", codes: ["PUBPOL 303"] }, { type: "single", codes: ["PPE 490"] }],
      disciplinary: [{ type: "single", codes: ["HIST 227"] }, { type: "single", codes: ["ECON 204"] }, { type: "single", codes: ["ECON 212"] }, { type: "or", options: [["HIST 201"]] }, { type: "or", options: [["GCHINA 301"], ["POLECON 301"], ["ECON 307"]] }],
      electives: [{ type: "single", codes: ["ECON 225"] }, { type: "single", codes: ["ECON 301"] }, { type: "single", codes: ["ECON 302"] }, { type: "single", codes: ["ENVIR 302"] }, { type: "single", codes: ["ECON 303"] }, { type: "single", codes: ["ECON 304"] }, { type: "single", codes: ["ECON 310"] }, { type: "single", codes: ["ECON 314"] }, { type: "single", codes: ["HIST 228"] }, { type: "single", codes: ["HIST 229"] }, { type: "single", codes: ["HIST 309"] }, { type: "single", codes: ["POLECON 201"] }, { type: "single", codes: ["STATS 201"] }],
    },
  },
  {
    major: "Philosophy, Politics, and Economics",
    track: "Philosophy",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["SOSC 101"] }, { type: "single", codes: ["ARHU 101"] }],
      interdisciplinary: [{ type: "single", codes: ["PPE 101"] }, { type: "single", codes: ["ECON 101"] }, { type: "single", codes: ["ECON 201"] }, { type: "single", codes: ["PUBPOL 303"] }, { type: "single", codes: ["PPE 490"] }],
      disciplinary: [{ type: "single", codes: ["HIST 226"] }, { type: "single", codes: ["PHIL 398"] }, { type: "or", options: [["PHIL 205"], ["PHIL 305"], ["PHIL 309"]] }],
      electives: [{ type: "single", codes: ["ETHLDR 202"] }, { type: "single", codes: ["ETHLDR 203"] }, { type: "single", codes: ["HIST 101"] }, { type: "single", codes: ["PHIL 101"] }, { type: "single", codes: ["PHIL 207"] }, { type: "single", codes: ["BIOL 320"] }, { type: "single", codes: ["ECON 225"] }, { type: "single", codes: ["ETHLDR 204"] }, { type: "single", codes: ["HUM 201"] }, { type: "single", codes: ["GLHLTH 201"] }, { type: "single", codes: ["LIT 315"] }, { type: "single", codes: ["PHIL 112"] }, { type: "single", codes: ["PHIL 115"] }, { type: "single", codes: ["PHIL 303"] }, { type: "single", codes: ["POLSCI 223"] }, { type: "single", codes: ["POLSCI 398"] }, { type: "single", codes: ["SOCIOL 305"] }],
    },
  },
  {
    major: "Philosophy, Politics, and Economics",
    track: "Political Science",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["SOSC 101"] }, { type: "single", codes: ["SOSC 102"] }, { type: "single", codes: ["STATS 101"] }],
      interdisciplinary: [{ type: "single", codes: ["PPE 101"] }, { type: "single", codes: ["ECON 101"] }, { type: "single", codes: ["ECON 201"] }, { type: "single", codes: ["PUBPOL 303"] }, { type: "single", codes: ["PPE 490"] }],
      disciplinary: [{ type: "single", codes: ["POLSCI 101"] }, { type: "single", codes: ["POLSCI 104"] }, { type: "single", codes: ["POLSCI 223"] }, { type: "single", codes: ["CULSOC 201"] }, { type: "or", options: [["POLSCI 303"], ["POLSCI 307"], ["POLSCI 308"]] }],
      electives: [{ type: "single", codes: ["ETHLDR 202"] }, { type: "single", codes: ["ETHLDR 203"] }, { type: "single", codes: ["HIST 225"] }, { type: "single", codes: ["GCHINA 202"] }, { type: "single", codes: ["PHIL 309"] }, { type: "single", codes: ["POLECON 201"] }, { type: "single", codes: ["POLECON 301"] }, { type: "single", codes: ["POLECON 302", "GCHINA 301"] }, { type: "single", codes: ["PUBPOL 213"] }, { type: "single", codes: ["PUBPOL 301"] }, { type: "single", codes: ["SOSC 206"] }, { type: "single", codes: ["SOCIOL 305"] }, { type: "single", codes: ["SOSC 314"] }],
    },
  },
  {
    major: "Philosophy, Politics, and Economics",
    track: "Public Policy",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["SOSC 101"] }, { type: "single", codes: ["SOSC 102"] }, { type: "single", codes: ["STATS 101"] }],
      interdisciplinary: [{ type: "single", codes: ["PPE 101"] }, { type: "single", codes: ["ECON 101"] }, { type: "single", codes: ["ECON 201"] }, { type: "single", codes: ["PUBPOL 303"] }, { type: "single", codes: ["PPE 490"] }],
      disciplinary: [{ type: "single", codes: ["PUBPOL 101"] }, { type: "single", codes: ["POLSCI 104"] }, { type: "single", codes: ["PUBPOL 301"] }, { type: "single", codes: ["PUBPOL 315"] }, { type: "single", codes: ["ECON 315"] }, { type: "or", options: [["PUBPOL 204"], ["PUBPOL 221"], ["PUBPOL 222"], ["SOCIOL 223"]] }],
      electives: [{ type: "single", codes: ["ETHLDR 202"] }, { type: "single", codes: ["ETHLDR 203"] }, { type: "single", codes: ["SOSC 309"] }, { type: "single", codes: ["CULSOC 201"] }, { type: "single", codes: ["ENVIR 301"] }, { type: "single", codes: ["GCHINA 202"] }, { type: "single", codes: ["GLHLTH 303"] }, { type: "single", codes: ["POLSCI 302"] }, { type: "single", codes: ["POLSCI 307"] }, { type: "single", codes: ["PUBPOL 213"] }, { type: "single", codes: ["SOSC 315"] }, { type: "single", codes: ["SOSC 206"] }],
    },
  },
  {
    major: "Quantitative Political Economy",
    track: "Economics",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["SOSC 102"] }, { type: "single", codes: ["STATS 101"] }, { type: "or", options: [["MATH 101"], ["MATH 105"]] }],
      interdisciplinary: [{ type: "single", codes: ["ECON 101"] }, { type: "single", codes: ["PPE 202"] }, { type: "single", codes: ["POLECON 201"] }, { type: "single", codes: ["SOSC 205"] }, { type: "or", options: [["SOSC 302"], ["SOSC 314"], ["SOSC 320"]] }, { type: "or", options: [["POLECON 301"], ["POLECON 302", "GCHINA 301"]] }, { type: "single", codes: ["POLECON 490"] }],
      disciplinary: [{ type: "single", codes: ["ECON 201"] }, { type: "single", codes: ["ECON 202"] }, { type: "single", codes: ["ECON 204"] }, { type: "or", options: [["ECON 301"], ["ECON 302", "ENVIR 302"], ["ECON 303"], ["ECON 304"], ["ECON 305"], ["ECON 307"], ["ECON 310"], ["ECON 314"], ["PUBPOL 315"], ["ECON 318"], ["ECON 333"]] }],
      electives: [{ type: "single", codes: ["COMPSCI 206"] }, { type: "single", codes: ["ECON 212"] }, { type: "single", codes: ["ECON 213"] }, { type: "single", codes: ["ECON 225"] }, { type: "single", codes: ["HIST 225"] }, { type: "single", codes: ["BEHAVSCI 101"] }, { type: "single", codes: ["BEHAVSCI 102"] }, { type: "single", codes: ["ECON 317"] }, { type: "single", codes: ["MATH 317"] }, { type: "single", codes: ["STATS 201"] }, { type: "single", codes: ["STATS 102"] }, { type: "single", codes: ["MATH 201"] }, { type: "single", codes: ["MATH 202"] }, { type: "single", codes: ["MATH 206"] }, { type: "single", codes: ["MATH 308"] }],
    },
  },
  {
    major: "Quantitative Political Economy",
    track: "Political Science",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["SOSC 102"] }, { type: "single", codes: ["STATS 101"] }, { type: "or", options: [["MATH 101"], ["MATH 105"]] }],
      interdisciplinary: [{ type: "single", codes: ["ECON 101"] }, { type: "or", options: [["SOSC 314"], ["GCHINA 301"]] }],
      disciplinary: [{ type: "single", codes: ["POLSCI 101"] }, { type: "single", codes: ["POLSCI 104"] }, { type: "single", codes: ["POLSCI 302"] }, { type: "single", codes: ["POLSCI 307"] }, { type: "single", codes: ["POLSCI 308"] }],
      electives: [{ type: "single", codes: ["CULSOC 201"] }, { type: "single", codes: ["GCHINA 202"] }, { type: "single", codes: ["POLSCI 223"] }, { type: "single", codes: ["PUBPOL 213"] }, { type: "single", codes: ["PUBPOL 301"] }],
    },
  },
  {
    major: "Quantitative Political Economy",
    track: "Public Policy",
    categories: {
      divisionalFoundation: [{ type: "single", codes: ["SOSC 102"] }, { type: "single", codes: ["STATS 101"] }, { type: "or", options: [["MATH 101"], ["MATH 105"]] }],
      interdisciplinary: [{ type: "single", codes: ["ECON 101"] }, { type: "single", codes: ["POLECON 201"] }, { type: "or", options: [["SOSC 314"], ["POLECON 301"], ["POLECON 302"]] }, { type: "or", options: [["GCHINA 301"], ["POLECON 490"]] }, { type: "single", codes: ["PUBPOL 101"] }, { type: "single", codes: ["PUBPOL 301"] }, { type: "single", codes: ["PUBPOL 303"] }, { type: "single", codes: ["PUBPOL 315"] }, { type: "single", codes: ["ECON 315"] }],
      electives: [{ type: "single", codes: ["PUBPOL 213"] }, { type: "single", codes: ["PUBPOL 221"] }, { type: "single", codes: ["CULSOC 201"] }, { type: "single", codes: ["GLHLTH 303"] }, { type: "single", codes: ["ENVIR 301"] }, { type: "single", codes: ["PUBPOL 223"] }],
    },
  },
];

export const MAJOR_NAMES: string[] = Array.from(new Set(MAJOR_REQUIREMENTS.map((m) => m.major))).sort();

export function tracksForMajor(major: string): (string | null)[] {
  return MAJOR_REQUIREMENTS.filter((m) => m.major === major).map((m) => m.track);
}

export function getMajorRequirements(major: string, track: string | null): MajorRequirements | undefined {
  return MAJOR_REQUIREMENTS.find((m) => m.major === major && m.track === track);
}
