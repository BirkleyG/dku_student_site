import { z } from "zod";
import type { EventCategory } from "@prisma/client";
import { EVENT_CATEGORIES } from "@/lib/event-categories";

const categoryKeys = EVENT_CATEGORIES.map((c) => c.key) as [EventCategory, ...EventCategory[]];

export const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Title is too short").max(120),
    description: z.string().trim().min(10, "Tell people what this is").max(4000),
    location: z.string().trim().min(2, "Where is this happening?").max(200),
    posterUrl: z.string().trim().url("Enter a valid image URL").optional().or(z.literal("")),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]).default("NONE"),
    category: z.enum(categoryKeys).default("SOCIAL_EVENTS"),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: "End time must be after the start time",
    path: ["endsAt"],
  });

export type EventInput = z.infer<typeof eventSchema>;
