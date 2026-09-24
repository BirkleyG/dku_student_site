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

export const courseResourceSchema = z.object({
  type: z.enum(courseResourceTypes),
  title: z.string().trim().min(2, "Give it a title").max(160),
  semester: z.string().trim().max(40).optional().or(z.literal("")),
  body: z.string().trim().max(6000).optional().or(z.literal("")),
  fileUrl: z.string().trim().url("Enter a valid link").optional().or(z.literal("")),
});

export type CourseResourceInput = z.infer<typeof courseResourceSchema>;
