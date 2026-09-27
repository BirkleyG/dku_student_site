import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, HeadingLevel, AlignmentType } from "docx";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeDegreeProgress, computeMajorProgress } from "@/lib/planner-progress";

type Params = { params: Promise<{ id: string }> };

const SESSION_LABEL: Record<string, string> = {
  SESSION_1: "Session 1",
  SESSION_2: "Session 2",
  MINI_TERM: "Mini-Term",
  FULL: "Full Semester",
};

function headerCell(text: string) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
    width: { size: 20, type: WidthType.PERCENTAGE },
  });
}

function bodyCell(text: string) {
  return new TableCell({ children: [new Paragraph(text)] });
}

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const plan = await prisma.academicPlan.findFirst({
    where: { id, userId: user.id },
    include: { courses: true },
  });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const degree = computeDegreeProgress(plan.courses);
  const majorProgress = computeMajorProgress(plan.major, plan.track, plan.courses);

  const gridRows: TableRow[] = [
    new TableRow({
      children: [headerCell("Year"), headerCell("Fall"), headerCell("Spring")],
    }),
  ];

  for (let year = 1; year <= 4; year++) {
    const cellForSemester = (semester: "FALL" | "SPRING") => {
      const courses = plan.courses.filter((c) => c.year === year && c.semester === semester);
      const lines = ["SESSION_1", "MINI_TERM", "SESSION_2", "FULL"]
        .flatMap((sessionKey) => {
          const inSlot = courses.filter((c) => c.session === sessionKey);
          if (inSlot.length === 0) return [];
          return [
            `${SESSION_LABEL[sessionKey]}:`,
            ...inSlot.map((c) => `  ${c.code} — ${c.title ?? ""} (${c.credits ?? "?"} cr)`),
          ];
        });
      return new TableCell({
        children: lines.length > 0 ? lines.map((l) => new Paragraph(l)) : [new Paragraph("")],
      });
    };

    gridRows.push(
      new TableRow({
        children: [bodyCell(`Year ${year}`), cellForSemester("FALL"), cellForSemester("SPRING")],
      }),
    );
  }

  const grid = new Table({ rows: gridRows, width: { size: 100, type: WidthType.PERCENTAGE } });

  const requirementRows: TableRow[] = [
    new TableRow({ children: [headerCell("Category"), headerCell("Requirement"), headerCell("Status")] }),
  ];
  if (majorProgress) {
    for (const [category, data] of Object.entries(majorProgress.categories)) {
      for (const unit of data.units) {
        requirementRows.push(
          new TableRow({
            children: [bodyCell(category), bodyCell(unit.label), bodyCell(unit.satisfiedBy ? "Complete" : "Not yet")],
          }),
        );
      }
    }
  }
  const requirementsTable = new Table({ rows: requirementRows, width: { size: 100, type: WidthType.PERCENTAGE } });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "Four-Year Plan Worksheet", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: plan.name, alignment: AlignmentType.LEFT }),
          new Paragraph({ text: `Major: ${plan.major ?? "—"}${plan.track ? ` / ${plan.track}` : ""}` }),
          new Paragraph({ text: "" }),
          grid,
          new Paragraph({ text: "" }),
          new Paragraph({ text: "Requirements", heading: HeadingLevel.HEADING_2 }),
          requirementsTable,
          new Paragraph({ text: "" }),
          new Paragraph({ text: `TOTAL CREDITS: ${degree.totalCredits} / ${degree.creditsNeeded} REQUIRED FOR GRADUATION`, heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: "The credits required for graduation may include:" }),
          new Paragraph({ text: "· No more than 8 credits passed with a D grade (D, D+, D-)" }),
          new Paragraph({ text: "· No more than 2 credits in physical education activity courses" }),
          new Paragraph({ text: "· No more than 16 credits taken on a Credit/No Credit grading basis" }),
          new Paragraph({ text: "· No more than 40 credits combining any allowable transfer credits" }),
          new Paragraph({ text: "· No more than the DKU equivalent of 24 credits in graduate and professional school courses" }),
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
