import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, VerticalAlign } from "docx";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveExclusiveGenEd } from "@/lib/planner-progress";
import { isLanguageCourse } from "@/lib/planner-language";

type Params = { params: Promise<{ id: string }> };
type PlanCourse = Awaited<ReturnType<typeof loadPlan>> extends { courses: (infer C)[] } | null ? C : never;

async function loadPlan(id: string, userId: string) {
  return prisma.academicPlan.findFirst({ where: { id, userId }, include: { courses: true } });
}

const YEAR_WORDS = ["ONE", "TWO", "THREE", "FOUR"];

function sessionIndex(semester: "FALL" | "SPRING", session: string): number {
  const base = semester === "FALL" ? 0 : 2;
  if (session === "SESSION_2") return base + 2;
  return base + 1; // SESSION_1 and FULL both anchor to the semester's first session
}

function yearSessionLabel(c: PlanCourse): string {
  return `Y${c.year} S${sessionIndex(c.semester, c.session)}`;
}

function cell(text: string, opts: { span?: number; bold?: boolean; shaded?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  return new TableCell({
    columnSpan: opts.span,
    shading: opts.shaded ? { fill: "EFE9DA" } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: opts.align,
        children: [new TextRun({ text, bold: opts.bold })],
      }),
    ],
  });
}

function spanRow(text: string, totalCols: number, opts: { bold?: boolean; shaded?: boolean } = {}) {
  return new TableRow({ children: [cell(text, { span: totalCols, bold: opts.bold ?? true, shaded: opts.shaded ?? true, align: AlignmentType.CENTER })] });
}

const FULL_WIDTH = { size: 100, type: WidthType.PERCENTAGE } as const;

function yearGrid(year: number, courses: PlanCourse[]) {
  const inSlot = (semester: "FALL" | "SPRING", session: "SESSION_1" | "SESSION_2") =>
    courses.filter(
      (c) =>
        c.year === year &&
        c.semester === semester &&
        (c.session === session || (c.session === "FULL" && session === "SESSION_1")),
    );

  const cols = [
    { semester: "FALL" as const, session: "SESSION_1" as const },
    { semester: "FALL" as const, session: "SESSION_2" as const },
    { semester: "SPRING" as const, session: "SESSION_1" as const },
    { semester: "SPRING" as const, session: "SESSION_2" as const },
  ].map((c) => ({ ...c, courses: inSlot(c.semester, c.session) }));

  const maxRows = Math.max(1, ...cols.map((c) => c.courses.length));

  const rows: TableRow[] = [];
  rows.push(spanRow(`YEAR ${YEAR_WORDS[year - 1]}`, 8));
  rows.push(
    new TableRow({
      children: [cell("FALL SEMESTER", { span: 4, bold: true, shaded: true, align: AlignmentType.CENTER }), cell("SPRING SEMESTER", { span: 4, bold: true, shaded: true, align: AlignmentType.CENTER })],
    }),
  );
  rows.push(
    new TableRow({
      children: [
        cell("SESSION 1", { span: 2, bold: true, align: AlignmentType.CENTER }),
        cell("SESSION 2", { span: 2, bold: true, align: AlignmentType.CENTER }),
        cell("SESSION 1", { span: 2, bold: true, align: AlignmentType.CENTER }),
        cell("SESSION 2", { span: 2, bold: true, align: AlignmentType.CENTER }),
      ],
    }),
  );
  rows.push(
    new TableRow({
      children: cols.flatMap(() => [cell("Course", { bold: true }), cell("credits", { bold: true })]),
    }),
  );

  for (let i = 0; i < maxRows; i++) {
    rows.push(
      new TableRow({
        children: cols.flatMap(({ courses: colCourses }) => {
          const c = colCourses[i];
          return [cell(c?.code ?? ""), cell(c?.credits ?? "")];
        }),
      }),
    );
  }

  rows.push(
    new TableRow({
      children: cols.flatMap(({ courses: colCourses }) => {
        const total = colCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
        return [cell("Total credits", { bold: true }), cell(colCourses.length > 0 ? String(total) : "")];
      }),
    }),
  );

  return new Table({ rows, width: FULL_WIDTH });
}

function footerBullets() {
  return [
    new Paragraph({ text: "The 136 credits may include:" }),
    new Paragraph({ text: "· No more than 8 credits passed with a D grade (D, D+, D-)" }),
    new Paragraph({ text: "· No more than 2 credits in physical education activity courses (i.e. four half-credit activity courses)" }),
    new Paragraph({ text: "· No more than 16 credits taken on a Credit/No Credit grading basis (not including courses offered only on that basis)" }),
    new Paragraph({ text: "· No more than 40 credits combining any allowable transfer credits including AP/IPC, transfer credits for study abroad, etc." }),
    new Paragraph({
      text: "· No more than Duke Kunshan University equivalent of 24 credits in graduate and professional school courses not listed in the Duke Kunshan University Undergraduate Programs Bulletin",
    }),
  ];
}

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const plan = await loadPlan(id, user.id);
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const courses = plan.courses;
  const gridCourses = courses.filter((c) => c.session !== "MINI_TERM");
  const miniTermCourses = courses.filter((c) => c.session === "MINI_TERM");
  const totalCredits = courses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);

  const distribution = resolveExclusiveGenEd(courses);
  const courseById = (courseId: string | null) => (courseId ? courses.find((c) => c.id === courseId) ?? null : null);
  const arhu = courseById(distribution.slotAssignment.DISTRIBUTION_ARHU);
  const nas = courseById(distribution.slotAssignment.DISTRIBUTION_NAS);
  const ss = courseById(distribution.slotAssignment.DISTRIBUTION_SS);
  const qr = courseById(distribution.slotAssignment.QUANTITATIVE_REASONING);

  const commonCore = {
    Y1: courses.find((c) => c.genEdTags.includes("COMMON_CORE_Y1")) ?? null,
    Y2: courses.find((c) => c.genEdTags.includes("COMMON_CORE_Y2")) ?? null,
    Y3: courses.find((c) => c.genEdTags.includes("COMMON_CORE_Y3")) ?? null,
  };
  const languageCourses = courses.filter((c) => isLanguageCourse(c.code));
  const dukeFacultyCourses = courses.filter((c) => c.genEdTags.includes("DUKE_FACULTY"));
  const chscCourses = courses.filter((c) => c.code.toUpperCase().startsWith("CHSC"));
  const militaryCourses = courses.filter((c) => c.code.toUpperCase().startsWith("MILITSCI"));

  const majorLine = plan.major
    ? `Major of Interest _____________ ${plan.major.toUpperCase()}${plan.track ? ` WITH TRACKS IN ${plan.track.toUpperCase()}` : ""} _____________`
    : "Major of Interest _____________________________________________";

  const yearGrids = [1, 2, 3, 4].flatMap((year) => [yearGrid(year, gridCourses), new Paragraph({ text: "" })]);

  const commonCoreRows = (["Y1", "Y2", "Y3"] as const).map((key, i) => {
    const c = commonCore[key];
    const lang = languageCourses[i];
    return new TableRow({
      children: [
        cell(c?.title || c?.code || ""),
        cell(c ? `Y${key.slice(1)} S${sessionIndex(c.semester, c.session)}` : ""),
        cell(lang?.code ?? ""),
        cell(lang?.credits ?? ""),
      ],
    });
  });
  // Any language courses beyond the 3 common-core-aligned rows still need a row.
  for (let i = 3; i < languageCourses.length; i++) {
    const lang = languageCourses[i];
    commonCoreRows.push(new TableRow({ children: [cell(""), cell(""), cell(lang.code), cell(lang.credits ?? "")] }));
  }

  const genEdTable = new Table({
    width: FULL_WIDTH,
    rows: [
      spanRow("GENERAL EDUCATION REQUIREMENTS", 4),
      new TableRow({
        children: [cell("COMMON CORE", { span: 2, bold: true, shaded: true }), cell("LANGUAGE COURSES", { span: 2, bold: true, shaded: true })],
      }),
      new TableRow({
        children: [
          cell("3 courses required; 12 credits total", { span: 2 }),
          cell("2-4 courses required; 8-16 credits total", { span: 2 }),
        ],
      }),
      new TableRow({ children: [cell("Course", { bold: true }), cell("Yr / Session", { bold: true }), cell("Course", { bold: true }), cell("Credits", { bold: true })] }),
      ...commonCoreRows,

      spanRow("DISTRIBUTION REQUIREMENTS", 4),
      new TableRow({ children: [cell("3 courses required; 12 credits total", { span: 4 })] }),
      new TableRow({ children: [cell("", { bold: true }), cell("Course", { bold: true }), cell("Year / Session", { bold: true }), cell("Credits", { bold: true })] }),
      new TableRow({
        children: [cell("Arts and Humanities"), cell(arhu?.code ?? ""), cell(arhu ? yearSessionLabel(arhu) : ""), cell(arhu?.credits ?? "")],
      }),
      new TableRow({
        children: [cell("Natural and Applied Sciences"), cell(nas?.code ?? ""), cell(nas ? yearSessionLabel(nas) : ""), cell(nas?.credits ?? "")],
      }),
      new TableRow({
        children: [cell("Social Sciences"), cell(ss?.code ?? ""), cell(ss ? yearSessionLabel(ss) : ""), cell(ss?.credits ?? "")],
      }),

      spanRow("QUANTITATIVE REASONING", 4),
      new TableRow({ children: [cell("1 course required; 4 credits total", { span: 4 })] }),
      new TableRow({ children: [cell("Course", { bold: true, span: 2 }), cell("Year / Session", { bold: true }), cell("Credits", { bold: true })] }),
      new TableRow({ children: [cell(qr?.code ?? "", { span: 2 }), cell(qr ? yearSessionLabel(qr) : ""), cell(qr?.credits ?? "")] }),

      spanRow("DEGREE REQUIREMENTS", 4),
      spanRow("COURSES TAUGHT/CO-TAUGHT BY DUKE FACULTY", 4, { shaded: false }),
      new TableRow({ children: [cell("34 credits total", { span: 4 })] }),
      new TableRow({
        children: [cell("Course", { bold: true }), cell("Year/Session", { bold: true }), cell("Course", { bold: true }), cell("Year/Session", { bold: true })],
      }),
      ...Array.from({ length: Math.max(1, Math.ceil(dukeFacultyCourses.length / 2)) }, (_, i) => {
        const a = dukeFacultyCourses[i * 2];
        const b = dukeFacultyCourses[i * 2 + 1];
        return new TableRow({
          children: [cell(a?.code ?? ""), cell(a ? yearSessionLabel(a) : ""), cell(b?.code ?? ""), cell(b ? yearSessionLabel(b) : "")],
        });
      }),

      spanRow("NON-CREDIT MINI-TERM", 4),
      new TableRow({ children: [cell("1 course required", { span: 4 })] }),
      new TableRow({ children: [cell("Course", { bold: true, span: 3 }), cell("Year/Session", { bold: true })] }),
      ...(miniTermCourses.length > 0
        ? miniTermCourses.map(
            (c) => new TableRow({ children: [cell(c.code, { span: 3 }), cell(`Y${c.year} MINITERM`)] }),
          )
        : [new TableRow({ children: [cell("", { span: 3 }), cell("")] })]),

      spanRow("MAJOR REQUIREMENTS", 4),
      new TableRow({
        children: [
          cell(
            "Check the Undergraduate Bulletin to make sure you have fulfilled/have a plan to fulfill all of the requirements for your intended major: Divisional Foundation Courses, Interdisciplinary Studies Courses, Disciplinary Studies Courses, Signature Work, and Electives. Students are expected to adhere to the major and degree requirements of the Undergraduate Bulletin of their matriculation year.",
            { span: 4 },
          ),
        ],
      }),

      spanRow("ADDITIONAL REQUIREMENTS FOR CHINESE MAINLAND STUDENTS, INCLUDING HK/TAIWAN/MACAU", 4),
      new TableRow({
        children: [cell("PHYSICAL EDUCATION", { span: 2, bold: true, shaded: true }), cell("MILITARY TRAINING, CHINESE CULTURE & SOCIETY COURSES", { span: 2, bold: true, shaded: true })],
      }),
      new TableRow({ children: [cell("4 credits", { span: 2 }), cell("", { span: 2 })] }),
      new TableRow({
        children: [cell("Course", { bold: true }), cell("Yr/Session", { bold: true }), cell("Course", { bold: true }), cell("Yr/Session", { bold: true })],
      }),
      ...Array.from({ length: Math.max(1, militaryCourses.length + chscCourses.length) }, (_, i) => {
        const b = i === 0 ? "Military Training" : chscCourses[i - 1]?.code;
        const bSession = i === 0 ? militaryCourses[0] : chscCourses[i - 1];
        return new TableRow({
          children: [cell(""), cell(""), cell(b ?? ""), cell(bSession ? yearSessionLabel(bSession) : "")],
        });
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: majorLine, bold: true })] }),
          new Paragraph({ text: "" }),
          ...yearGrids,
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Total up all your credits: ${totalCredits} = ${totalCredits}/136 credits to graduate` })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "See last page for additional information about counting credits toward graduation." })],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Fill out the table below to ensure you have completed or will complete all general education and degree requirements.",
          }),
          new Paragraph({ text: "" }),
          genEdTable,
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "TOTAL CREDITS REQUIRED FOR GRADUATION: 136 CREDITS", bold: true })], alignment: AlignmentType.CENTER }),
          ...footerBullets(),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [new TextRun({ text: "ADDITIONAL REQUIREMENTS FOR CHINESE MAINLAND, HONG KONG, MACAU, TAIWAN STUDENTS", bold: true })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: "Class of 2023 & Beyond Chinese Mainland, Hong Kong, Macau, Taiwan Students: 158 credits total, inclusive of the 136 credits required for all students",
          }),
          new Paragraph({ text: "· 4 credits of Military Training" }),
          new Paragraph({ text: "· 16 credits Ministry of Education courses CHSC 101 and 102" }),
          new Paragraph({
            text: "· 4 credits PE (2 of which can count toward the 136 credits for the Duke degree); passing the physical proficiency test set by the Ministry of Education of China",
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "RESOURCES", bold: true })], alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "· Access the DKU UG Advising Box Drive has resources for major exploration and degree requirements." }),
          new Paragraph({ text: "· Questions? Schedule a meeting with your advisor or email advising@dukekunshan.edu.cn!" }),
          new Paragraph({ text: "" }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `Updated ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${plan.name.replace(/[^a-z0-9]+/gi, "-")}-four-year-plan.docx"`,
    },
  });
}
