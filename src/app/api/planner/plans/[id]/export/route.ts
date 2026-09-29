import { readFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveExclusiveGenEd, getCommonCoreStatus } from "@/lib/planner-progress";
import { isLanguageCourse } from "@/lib/planner-language";
import { fillFourYearPlanTemplate, type YearTableData, type GenEdTableData } from "@/lib/planner-docx-template";

type Params = { params: Promise<{ id: string }> };
type PlanCourse = Awaited<ReturnType<typeof loadPlan>> extends { courses: (infer C)[] } | null ? C : never;

async function loadPlan(id: string, userId: string) {
  return prisma.academicPlan.findFirst({ where: { id, userId }, include: { courses: true } });
}

const TEMPLATE_PATH = path.join(process.cwd(), "src/lib/planner-template/four-year-plan-template.docx");

function sessionIndex(semester: "FALL" | "SPRING", session: string): number {
  const base = semester === "FALL" ? 0 : 2;
  if (session === "SESSION_2") return base + 2;
  return base + 1; // SESSION_1 and FULL both anchor to the semester's first session
}

function yearSessionLabel(c: PlanCourse): string {
  return `Y${c.year} S${sessionIndex(c.semester, c.session)}`;
}

function buildYearTable(year: number, courses: PlanCourse[]): YearTableData {
  const columnDefs = [
    { semester: "FALL" as const, session: "SESSION_1" as const },
    { semester: "FALL" as const, session: "SESSION_2" as const },
    { semester: "SPRING" as const, session: "SESSION_1" as const },
    { semester: "SPRING" as const, session: "SESSION_2" as const },
  ];
  const columns = columnDefs.map(({ semester, session }) =>
    courses
      .filter(
        (c) =>
          c.year === year &&
          c.semester === semester &&
          (c.session === session || (c.session === "FULL" && session === "SESSION_1")),
      )
      .map((c) => ({ code: c.code, credits: c.credits ?? "" })),
  );
  return { columns };
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
  const totalCredits = courses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);

  const distribution = resolveExclusiveGenEd(courses);
  const courseById = (courseId: string | null) => (courseId ? (courses.find((c) => c.id === courseId) ?? null) : null);
  const arhu = courseById(distribution.slotAssignment.DISTRIBUTION_ARHU);
  const nas = courseById(distribution.slotAssignment.DISTRIBUTION_NAS);
  const ss = courseById(distribution.slotAssignment.DISTRIBUTION_SS);
  const qr = courseById(distribution.slotAssignment.QUANTITATIVE_REASONING);
  const distField = (c: PlanCourse | null) => ({ code: c?.code ?? "", yearSession: c ? yearSessionLabel(c) : "", credits: c?.credits ?? "" });

  const commonCore = getCommonCoreStatus(courses);
  const languageCourses = courses.filter((c) => isLanguageCourse(c.code));
  const dukeFacultyCourses = courses.filter((c) => c.genEdTags.includes("DUKE_FACULTY"));
  const militaryCourse = courses.find((c) => c.code.toUpperCase().startsWith("MILITSCI")) ?? null;
  const chsc101 = courses.find((c) => c.code.toUpperCase() === "CHSC 101") ?? null;
  const chsc102 = courses.find((c) => c.code.toUpperCase() === "CHSC 102") ?? null;

  const genEd: GenEdTableData = {
    commonCoreSessions: [1, 2, 3].map((y) => {
      const c = commonCore[y as 1 | 2 | 3];
      return c ? yearSessionLabel(c) : "";
    }) as [string, string, string],
    languageCourses: languageCourses.map((c) => ({ code: c.code, credits: c.credits ?? "" })),
    distribution: { arhu: distField(arhu), nas: distField(nas), ss: distField(ss) },
    qr: distField(qr),
    dukeFaculty: dukeFacultyCourses.map((c) => ({ code: c.code, yearSession: yearSessionLabel(c), credits: c.credits ?? "" })),
    miniTerm: plan.miniTermCompleted ? { code: "MINITERM", yearSession: "COMPLETED" } : null,
    military: militaryCourse ? { yearSession: yearSessionLabel(militaryCourse) } : null,
    chsc101: chsc101 ? { yearSession: yearSessionLabel(chsc101) } : null,
    chsc102: chsc102 ? { yearSession: yearSessionLabel(chsc102) } : null,
  };

  const majorLine = plan.major
    ? ` ${plan.major.toUpperCase()}${plan.track ? ` WITH TRACKS IN ${plan.track.toUpperCase()}` : ""} `
    : "                                                             ";

  const templateBuffer = await readFile(TEMPLATE_PATH);
  const zip = await JSZip.loadAsync(templateBuffer);
  const documentXmlPath = "word/document.xml";
  const documentXml = await zip.file(documentXmlPath)!.async("string");

  const filledXml = fillFourYearPlanTemplate(documentXml, {
    majorLine,
    totalCredits,
    years: [1, 2, 3, 4].map((year) => buildYearTable(year, gridCourses)) as [YearTableData, YearTableData, YearTableData, YearTableData],
    genEd,
  });

  zip.file(documentXmlPath, filledXml);
  const buffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${plan.name.replace(/[^a-z0-9]+/gi, "-")}-four-year-plan.docx"`,
    },
  });
}
