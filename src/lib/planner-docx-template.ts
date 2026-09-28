// Fills in the ACTUAL uploaded "Four-Year Plan Worksheet" template
// (four-year-plan-template.docx, an .docx conversion of the user's own
// filled-in sample) rather than reconstructing the layout from scratch, so
// the export is byte-for-byte the same document structure/formatting DKU
// students already use — only the data cells change.
//
// The template's static structure (converted once via `soffice --headless
// --convert-to docx`, then inspected table-by-table) is:
//   - Tables 0-3: one per year, each 9 rows x 8 cols. Row 0 = "YEAR X"
//     header; row 1 = Fall/Spring semester headers; row 2 = Session 1/2
//     headers; row 3 = Course/credits column headers; rows 4-7 = up to 4
//     courses per (semester, session) column-pair; row 8 = Total credits.
//     Column pairs (course, credits): 0-1 = Fall S1, 2-3 = Fall S2,
//     4-5 = Spring S1, 6-7 = Spring S2.
//   - Table 4: the General Education Requirements table (36 rows) — see
//     the row map inline below.
// Regenerate the template asset (and this file's row indices) if the
// source .doc is ever replaced with a different layout.

const CELL_RE = /<w:tc>[\s\S]*?<\/w:tc>/g;
const ROW_RE = /<w:tr\b[\s\S]*?<\/w:tr>/g;
const TABLE_RE = /<w:tbl>[\s\S]*?<\/w:tbl>/g;
const RUN_TEXT_RE = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/;

type Span = { start: number; end: number; text: string };

function findSpans(haystack: string, re: RegExp): Span[] {
  const spans: Span[] = [];
  const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  let m: RegExpExecArray | null;
  while ((m = r.exec(haystack))) {
    spans.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
    if (m[0].length === 0) r.lastIndex++;
  }
  return spans;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Replace a table cell's visible text, preserving its formatting. Cells in
 * this template hold at most one run — if it already has a `<w:t>`, its
 * inner content is swapped; otherwise (a currently-empty cell) a `<w:t>` is
 * inserted into its existing (empty) run. */
function setCellText(cellXml: string, text: string): string {
  const escaped = escapeXml(text);
  const match = RUN_TEXT_RE.exec(cellXml);
  if (match) {
    const [full] = match;
    const openTagEnd = full.indexOf(">") + 1;
    const openTag = full.slice(0, openTagEnd).replace(/^<w:t(?:\s[^>]*)?>/, '<w:t xml:space="preserve">');
    const replacement = `${openTag}${escaped}</w:t>`;
    return cellXml.slice(0, match.index) + replacement + cellXml.slice(match.index + full.length);
  }
  const lastRunClose = cellXml.lastIndexOf("</w:r>");
  if (lastRunClose === -1) return cellXml;
  return `${cellXml.slice(0, lastRunClose)}<w:t xml:space="preserve">${escaped}</w:t>${cellXml.slice(lastRunClose)}`;
}

export type TemplateEdit = { rowIndex: number; cellIndex: number; text: string };

/** Apply a set of (row, cell) -> text edits to one <w:tbl>...</w:tbl> block,
 * returning the modified table XML. Rows/cells not mentioned are untouched. */
function applyTableEdits(tableXml: string, edits: TemplateEdit[]): string {
  const rowSpans = findSpans(tableXml, ROW_RE);
  const replacements: Span[] = [];

  for (const rowIndex of new Set(edits.map((e) => e.rowIndex))) {
    const rowSpan = rowSpans[rowIndex];
    if (!rowSpan) continue;
    const cellSpans = findSpans(rowSpan.text, CELL_RE);
    const rowEdits = edits.filter((e) => e.rowIndex === rowIndex);
    for (const edit of rowEdits) {
      const cellSpan = cellSpans[edit.cellIndex];
      if (!cellSpan) continue;
      const newCell = setCellText(cellSpan.text, edit.text);
      replacements.push({ start: rowSpan.start + cellSpan.start, end: rowSpan.start + cellSpan.end, text: newCell });
    }
  }

  replacements.sort((a, b) => b.start - a.start);
  let out = tableXml;
  for (const r of replacements) {
    out = out.slice(0, r.start) + r.text + out.slice(r.end);
  }
  return out;
}

export type YearTableData = {
  // [fallS1, fallS2, springS1, springS2], each an array of up to 4 {code, credits}
  columns: { code: string; credits: string }[][];
};

export type GenEdTableData = {
  commonCoreSessions: [string, string, string]; // Y1, Y2, Y3 — "" if not placed
  languageCourses: { code: string; credits: string }[]; // up to 4
  distribution: {
    arhu: { code: string; yearSession: string; credits: string };
    nas: { code: string; yearSession: string; credits: string };
    ss: { code: string; yearSession: string; credits: string };
  };
  qr: { code: string; yearSession: string; credits: string };
  dukeFaculty: { code: string; yearSession: string; credits: string }[]; // up to 10
  miniTerm: { code: string; yearSession: string } | null;
  military: { yearSession: string } | null;
  chsc101: { yearSession: string } | null;
  chsc102: { yearSession: string } | null;
};

function yearTableEdits(data: YearTableData): TemplateEdit[] {
  const edits: TemplateEdit[] = [];
  for (let col = 0; col < 4; col++) {
    const courseCellIndex = col * 2;
    const creditCellIndex = col * 2 + 1;
    const courses = data.columns[col] ?? [];
    let totalCredits = 0;
    for (let row = 0; row < 4; row++) {
      const course = courses[row];
      edits.push({ rowIndex: 4 + row, cellIndex: courseCellIndex, text: course?.code ?? "" });
      edits.push({ rowIndex: 4 + row, cellIndex: creditCellIndex, text: course?.credits ?? "" });
      totalCredits += Number(course?.credits) || 0;
    }
    edits.push({ rowIndex: 8, cellIndex: creditCellIndex, text: courses.length > 0 ? String(totalCredits) : "" });
  }
  return edits;
}

function genEdTableEdits(data: GenEdTableData): TemplateEdit[] {
  const edits: TemplateEdit[] = [];

  // Common Core (rows 3,4,6 — the course-title cells stay static; only the
  // Yr/Session column, cell 1, is ours to fill) + Language courses (cells 2-3).
  const commonCoreRows = [3, 4, 6];
  for (let i = 0; i < 3; i++) {
    edits.push({ rowIndex: commonCoreRows[i], cellIndex: 1, text: data.commonCoreSessions[i] });
  }
  const languageRows = [3, 4, 5, 6];
  for (let i = 0; i < 4; i++) {
    const lang = data.languageCourses[i];
    edits.push({ rowIndex: languageRows[i], cellIndex: 2, text: lang?.code ?? "" });
    edits.push({ rowIndex: languageRows[i], cellIndex: 3, text: lang?.credits ?? "" });
  }

  // Distribution: row 9 Arts & Humanities, 10 Natural/Applied Sciences, 11 Social Sciences.
  const dist: [number, GenEdTableData["distribution"]["arhu"]][] = [
    [9, data.distribution.arhu],
    [10, data.distribution.nas],
    [11, data.distribution.ss],
  ];
  for (const [row, d] of dist) {
    edits.push({ rowIndex: row, cellIndex: 1, text: d.code });
    edits.push({ rowIndex: row, cellIndex: 2, text: d.yearSession });
    edits.push({ rowIndex: row, cellIndex: 3, text: d.credits });
  }

  // Quantitative Reasoning: row 14.
  edits.push({ rowIndex: 14, cellIndex: 0, text: data.qr.code });
  edits.push({ rowIndex: 14, cellIndex: 1, text: data.qr.yearSession });
  edits.push({ rowIndex: 14, cellIndex: 2, text: data.qr.credits });

  // Duke faculty-taught: rows 18-22, two entries per row (cells 0-2 and 3-5).
  for (let i = 0; i < 10; i++) {
    const row = 18 + Math.floor(i / 2);
    const cellBase = (i % 2) * 3;
    const course = data.dukeFaculty[i];
    edits.push({ rowIndex: row, cellIndex: cellBase, text: course?.code ?? "" });
    edits.push({ rowIndex: row, cellIndex: cellBase + 1, text: course?.yearSession ?? "" });
    edits.push({ rowIndex: row, cellIndex: cellBase + 2, text: course?.credits ?? "" });
  }

  // Non-credit mini-term: row 25.
  edits.push({ rowIndex: 25, cellIndex: 0, text: data.miniTerm?.code ?? "" });
  edits.push({ rowIndex: 25, cellIndex: 1, text: data.miniTerm?.yearSession ?? "" });

  // Chinese-mainland Military Training / CHSC 101 / CHSC 102 — the label
  // cells are static template text; only the Yr/Session column (cell 4) is ours.
  edits.push({ rowIndex: 31, cellIndex: 4, text: data.military?.yearSession ?? "" });
  edits.push({ rowIndex: 32, cellIndex: 4, text: data.chsc101?.yearSession ?? "" });
  edits.push({ rowIndex: 33, cellIndex: 4, text: data.chsc102?.yearSession ?? "" });

  return edits;
}

export function fillFourYearPlanTemplate(
  templateXml: string,
  data: {
    majorLine: string; // e.g. " ECONOMICS " or " QUANTITATIVE POLITICAL ECONOMY WITH TRACKS IN ECONOMICS " (blank-padded)
    totalCredits: number;
    years: [YearTableData, YearTableData, YearTableData, YearTableData];
    genEd: GenEdTableData;
  },
): string {
  let xml = templateXml;

  // Paragraph-level replacements: these three runs' original text is unique
  // in the template, so a plain string replace is safe and avoids the
  // index-splicing machinery the tables need.
  xml = xml.replace(
    " QUANTITATIVE POLITICAL ECONOMY WITH TRACKS IN ECONOMICS ",
    data.majorLine,
  );
  xml = xml.replace(
    "126 (+8 Transferred, +2 Frisbee Varsity) = 136",
    `${data.totalCredits} = ${data.totalCredits}`,
  );
  xml = xml.replace(
    "Updated August 2024",
    `Updated ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
  );

  const tableSpans = findSpans(xml, TABLE_RE);
  const replacements: Span[] = [];
  for (let i = 0; i < 4; i++) {
    const span = tableSpans[i];
    if (!span) continue;
    replacements.push({ start: span.start, end: span.end, text: applyTableEdits(span.text, yearTableEdits(data.years[i])) });
  }
  const genEdSpan = tableSpans[4];
  if (genEdSpan) {
    replacements.push({
      start: genEdSpan.start,
      end: genEdSpan.end,
      text: applyTableEdits(genEdSpan.text, genEdTableEdits(data.genEd)),
    });
  }

  replacements.sort((a, b) => b.start - a.start);
  for (const r of replacements) {
    xml = xml.slice(0, r.start) + r.text + xml.slice(r.end);
  }

  return xml;
}
