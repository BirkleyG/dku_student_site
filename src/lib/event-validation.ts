import { z } from "zod";
import type { EventCategory } from "@prisma/client";
import { EVENT_CATEGORIES } from "@/lib/event-categories";
import { UPLOAD_URL_PREFIX } from "@/lib/uploads";
import { DEFAULT_DURATION_MINUTES, MS_PER_DAY, campusStartOfDay, parseCampusInput } from "@/lib/datetime";

const categoryKeys = EVENT_CATEGORIES.map((c) => c.key) as [EventCategory, ...EventCategory[]];

export const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Title is too short").max(120),
    description: z.string().trim().min(10, "Tell people what this is").max(4000),
    location: z.string().trim().min(2, "Where is this happening?").max(200),
    // Either an image uploaded through /api/uploads, or (older events) an external URL.
    posterUrl: z
      .string()
      .trim()
      .refine(
        (value) => new RegExp(`^${UPLOAD_URL_PREFIX}[a-z0-9]+$`).test(value) || z.string().url().safeParse(value).success,
        "Upload an image for the poster",
      )
      .optional()
      .or(z.literal("")),
    // What the form sends: "2026-10-01T14:30" (or "2026-10-01" for all-day),
    // read as campus (Asia/Shanghai) time, or a full ISO string with an offset.
    startsAt: z.string().trim().min(1, "Pick a start"),
    // How long it lasts. endsAt is derived (start + duration); ignored for all-day.
    durationMinutes: z.coerce
      .number()
      .int()
      .min(5, "Duration is too short")
      .max(7 * 24 * 60, "Duration is too long")
      .default(DEFAULT_DURATION_MINUTES),
    allDay: z.boolean().default(false),
    kind: z.enum(["EVENT", "DEADLINE", "HOLIDAY"]).default("EVENT"),
    recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]).default("NONE"),
    category: z.enum(categoryKeys).default("SOCIAL_EVENTS"),
  })
  .transform((data, ctx) => {
    const parsed = parseCampusInput(data.startsAt);
    if (!parsed) {
      ctx.addIssue({ code: "custom", message: "Pick a valid start", path: ["startsAt"] });
      return z.NEVER;
    }
    const isDateOnly = !data.startsAt.includes("T") && !data.startsAt.includes(" ");
    if (!data.allDay && isDateOnly) {
      ctx.addIssue({ code: "custom", message: "Pick a start time", path: ["startsAt"] });
      return z.NEVER;
    }
    const { startsAt: _raw, durationMinutes, ...rest } = data;
    void _raw;
    if (data.allDay) {
      const start = campusStartOfDay(parsed);
      return { ...rest, startsAt: start, endsAt: new Date(start.getTime() + MS_PER_DAY), durationMinutes: 24 * 60 };
    }
    return { ...rest, startsAt: parsed, endsAt: new Date(parsed.getTime() + durationMinutes * 60_000), durationMinutes };
  });

export type EventInput = z.infer<typeof eventSchema>;
