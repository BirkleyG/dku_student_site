import { z } from "zod";

export const wisdomCategories = ["FOOD", "NIGHTLIFE", "ACTIVITIES", "TRAVEL", "STUDY", "OTHER"] as const;

export const wisdomCategoryLabels: Record<(typeof wisdomCategories)[number], string> = {
  FOOD: "Food",
  NIGHTLIFE: "Nightlife",
  ACTIVITIES: "Activities",
  TRAVEL: "Travel",
  STUDY: "Study spots",
  OTHER: "Other",
};

export const wisdomPostSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(140),
  category: z.enum(wisdomCategories),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().min(5, "Say a bit more").max(4000),
});

export type WisdomPostInput = z.infer<typeof wisdomPostSchema>;
