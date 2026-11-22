import { z } from "zod";
import { UPLOAD_URL_PREFIX } from "@/lib/uploads";

export const announcementSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(120),
  body: z.string().trim().min(5, "Say a bit more").max(4000),
  eventId: z.string().trim().max(60).optional().or(z.literal("")),
  // Only photos from our own upload endpoint, so a post can't hotlink arbitrary URLs.
  imageUrl: z
    .string()
    .trim()
    .max(120)
    .refine(
      (u) => u === "" || (u.startsWith(UPLOAD_URL_PREFIX) && /^[A-Za-z0-9_-]+$/.test(u.slice(UPLOAD_URL_PREFIX.length))),
      "Upload the photo again",
    )
    .optional(),
});

export const announcementVoteSchema = z.object({ value: z.union([z.literal(1), z.literal(-1)]) });
