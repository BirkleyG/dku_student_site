import { z } from "zod";
import { DKU_DEPARTMENTS } from "@/lib/departments";

// Adding a course should take ten seconds: department, code, title. Everything
// else (description, professor, materials) gets filled in afterward by anyone.
export const courseCreateSchema = z.object({
  department: z.enum(DKU_DEPARTMENTS),
  otherDepartment: z.string().trim().max(80).optional().or(z.literal("")),
  code: z.string().trim().min(2, "Enter a course code").max(20),
  title: z.string().trim().min(2, "Title is too short").max(160),
  credits: z.string().trim().max(10).optional().or(z.literal("")),
});

export type CourseCreateInput = z.infer<typeof courseCreateSchema>;

export const courseDescriptionSchema = z.object({
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type CourseDescriptionInput = z.infer<typeof courseDescriptionSchema>;

export const courseCommentSchema = z.object({
  body: z.string().trim().min(1, "Say something first").max(2000),
});

export type CourseCommentInput = z.infer<typeof courseCommentSchema>;

// Linking a professor to a course is its own step, done after the course
// exists — same "pick existing or add new" pattern as before.
export const courseOfferingSchema = z.object({
  professorId: z.string().trim().optional().or(z.literal("")),
  newProfessorFirstName: z.string().trim().max(80).optional().or(z.literal("")),
  newProfessorLastName: z.string().trim().max(80).optional().or(z.literal("")),
  newProfessorDepartment: z.enum(DKU_DEPARTMENTS).optional(),
  newProfessorEmail: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  semester: z.string().trim().max(40).optional().or(z.literal("")),
});

export type CourseOfferingInput = z.infer<typeof courseOfferingSchema>;

export const courseResourceTypes = ["SYLLABUS", "NOTES", "EXAM", "MATERIALS", "TIP"] as const;

export const courseResourceTypeLabels: Record<(typeof courseResourceTypes)[number], string> = {
  SYLLABUS: "Syllabus",
  NOTES: "Notes",
  EXAM: "Past exam",
  MATERIALS: "Course materials",
  TIP: "Tips & tricks",
};

// What a student can share. NOTES and TIP still exist on old rows, so they keep
// labels and filter chips, but new posts are one of these three.
export const courseShareTypes = ["SYLLABUS", "MATERIALS", "EXAM"] as const;

export const courseExamTypes = ["MIDTERM", "FINAL", "OTHER"] as const;

export const courseExamTypeLabels: Record<(typeof courseExamTypes)[number], string> = {
  MIDTERM: "Midterm",
  FINAL: "Final",
  OTHER: "Other",
};

// Files uploaded through /api/uploads come back as a relative path, so a plain
// z.url() rejects them — accept our own upload path or an absolute http(s) link.
const fileUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^\/api\/uploads\/[A-Za-z0-9_-]+$/.test(v) || /^https?:\/\/\S+$/.test(v), "Attach a file first");

const semesterSchema = z
  .string()
  .trim()
  .regex(/^(Fall|Spring|Summer Session 1|Summer Session 2) \d{4}$/, "Pick a session and enter the year");

const shareBase = {
  fileUrl: fileUrlSchema,
  fileName: z.string().trim().max(200).optional().or(z.literal("")),
};

export const courseResourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SYLLABUS"),
    professorId: z.string().trim().min(1, "Pick a professor"),
    semester: semesterSchema,
    ...shareBase,
  }),
  z.object({
    type: z.literal("EXAM"),
    professorId: z.string().trim().min(1, "Pick a professor"),
    examType: z.enum(courseExamTypes, { error: "Pick an exam type" }),
    ...shareBase,
  }),
  z.object({
    type: z.literal("MATERIALS"),
    title: z.string().trim().min(2, "Say what it is").max(160),
    body: z.string().trim().max(6000).optional().or(z.literal("")),
    ...shareBase,
  }),
]);

export type CourseResourceInput = z.infer<typeof courseResourceSchema>;
