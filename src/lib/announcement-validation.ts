import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(120),
  body: z.string().trim().min(5, "Say a bit more").max(4000),
  eventId: z.string().trim().max(60).optional().or(z.literal("")),
});

export const announcementVoteSchema = z.object({ value: z.union([z.literal(1), z.literal(-1)]) });
