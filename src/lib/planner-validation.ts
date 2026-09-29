import { z } from "zod";
import { MAJOR_NAMES } from "@/lib/major-requirements";

export const planCreateSchema = z.object({
  name: z.string().trim().min(1, "Give the plan a name").max(80),
  major: z.enum(MAJOR_NAMES as [string, ...string[]]).optional(),
  track: z.string().trim().max(80).optional().or(z.literal("")),
});

export type PlanCreateInput = z.infer<typeof planCreateSchema>;

export const planUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  major: z.enum(MAJOR_NAMES as [string, ...string[]]).nullable().optional(),
  track: z.string().trim().max(80).nullable().optional(),
  isPrimary: z.boolean().optional(),
  miniTermCompleted: z.boolean().optional(),
});

export type PlanUpdateInput = z.infer<typeof planUpdateSchema>;

const semesters = ["FALL", "SPRING"] as const;
// MINI_TERM stays in the DB enum but is no longer plannable (see AcademicPlan.miniTermCompleted).
const sessions = ["SESSION_1", "SESSION_2", "FULL"] as const;
const genEdTags = [
  "COMMON_CORE_Y1",
  "COMMON_CORE_Y2",
  "COMMON_CORE_Y3",
  "DISTRIBUTION_NAS",
  "DISTRIBUTION_SS",
  "DISTRIBUTION_ARHU",
  "QUANTITATIVE_REASONING",
  "WRITING",
  "DUKE_FACULTY",
] as const;

export const plannedCourseCreateSchema = z.object({
  year: z.number().int().min(1).max(4),
  semester: z.enum(semesters),
  session: z.enum(sessions),
  code: z.string().trim().min(2).max(20),
  title: z.string().trim().max(160).optional().or(z.literal("")),
  credits: z.string().trim().max(10).optional().or(z.literal("")),
  isCrNc: z.boolean().optional(),
  genEdTags: z.array(z.enum(genEdTags)).optional(),
});

export type PlannedCourseCreateInput = z.infer<typeof plannedCourseCreateSchema>;

export const plannedCourseUpdateSchema = plannedCourseCreateSchema.partial();

export type PlannedCourseUpdateInput = z.infer<typeof plannedCourseUpdateSchema>;
