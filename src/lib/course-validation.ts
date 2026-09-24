import { z } from "zod";

export const courseSchema = z.object({
  code: z.string().trim().min(2, "Enter a course code").max(20),
  title: z.string().trim().min(2, "Title is too short").max(160),
  department: z.string().trim().min(2, "Enter a department").max(80),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  professorId: z.string().trim().optional().or(z.literal("")),
  newProfessorFirstName: z.string().trim().max(80).optional().or(z.literal("")),
  newProfessorLastName: z.string().trim().max(80).optional().or(z.literal("")),
  newProfessorDepartment: z.string().trim().max(80).optional().or(z.literal("")),
  semester: z.string().trim().max(40).optional().or(z.literal("")),
});

export type CourseInput = z.infer<typeof courseSchema>;

export const courseResourceTypes = ["SYLLABUS", "NOTES", "EXAM", "TIP"] as const;

export const courseResourceTypeLabels: Record<(typeof courseResourceTypes)[number], string> = {
  SYLLABUS: "Syllabus",
  NOTES: "Notes",
  EXAM: "Past exam",
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
