import { z } from "zod";
import { DKU_DEPARTMENTS } from "@/lib/departments";

export const professorSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name").max(80),
  lastName: z.string().trim().min(1, "Enter a last name").max(80),
  department: z.enum(DKU_DEPARTMENTS),
  otherDepartment: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
});

export type ProfessorInput = z.infer<typeof professorSchema>;

export const professorReviewSchema = z.object({
  courseId: z.string().trim().optional().or(z.literal("")),
  gradingRating: z.coerce.number().int().min(1).max(5),
  difficultyRating: z.coerce.number().int().min(1).max(5),
  teachingRating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(3000).optional().or(z.literal("")),
});

export type ProfessorReviewInput = z.infer<typeof professorReviewSchema>;
