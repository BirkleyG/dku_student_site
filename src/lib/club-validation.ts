import { z } from "zod";

export const clubCategories = ["ACADEMIC", "ARTS", "SPORTS", "CULTURAL", "SERVICE", "SOCIAL", "OTHER"] as const;

export const clubCategoryLabels: Record<(typeof clubCategories)[number], string> = {
  ACADEMIC: "Academic",
  ARTS: "Arts",
  SPORTS: "Sports",
  CULTURAL: "Cultural",
  SERVICE: "Service",
  SOCIAL: "Social",
  OTHER: "Other",
};

export const clubSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  category: z.enum(clubCategories),
  description: z.string().trim().min(10, "Tell people what this club does").max(2000),
  contact: z.string().trim().max(200).optional().or(z.literal("")),
  logoUrl: z.string().trim().url("Enter a valid image URL").optional().or(z.literal("")),
});

export type ClubInput = z.infer<typeof clubSchema>;
