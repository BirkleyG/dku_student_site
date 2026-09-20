import { z } from "zod";

export const boardPostSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(140),
  body: z.string().trim().min(5, "Say a bit more").max(4000),
});

export type BoardPostInput = z.infer<typeof boardPostSchema>;

export const boardCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment can't be empty").max(2000),
});

export type BoardCommentInput = z.infer<typeof boardCommentSchema>;
