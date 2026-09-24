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

export const wisdomTopicSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(140),
  category: z.enum(wisdomCategories),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  requireLocation: z.boolean(),
});

export type WisdomTopicInput = z.infer<typeof wisdomTopicSchema>;

export const wisdomRecommendationSchema = z
  .object({
    placeName: z.string().trim().min(2, "Give it a name").max(140),
    location: z.string().trim().max(300).optional().or(z.literal("")),
    description: z.string().trim().min(5, "Say a bit more about why").max(2000),
    requireLocation: z.boolean().optional(),
  })
  .refine((data) => !data.requireLocation || (data.location && data.location.length > 0), {
    message: "This topic requires a location or map link",
    path: ["location"],
  });

export type WisdomRecommendationInput = z.infer<typeof wisdomRecommendationSchema>;
