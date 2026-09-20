import { z } from "zod";

export const newsPostSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(160),
  summary: z.string().trim().min(5, "Give it a one-line summary").max(280),
  body: z.string().trim().min(20, "The article needs more than that").max(20000),
});

export type NewsPostInput = z.infer<typeof newsPostSchema>;

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});
