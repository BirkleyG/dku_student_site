import { z } from "zod";

export const chatMessageSchema = z.object({
  body: z.string().trim().min(1, "Message can't be empty").max(4000),
  parentId: z.string().min(1).optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

export const chatGroupSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(60),
  description: z.string().trim().max(280).optional(),
});

export type ChatGroupInput = z.infer<typeof chatGroupSchema>;

export const chatJoinSchema = z.object({
  code: z.string().trim().min(1, "Enter an invite code").max(40),
});

export const chatDmSchema = z.object({
  userId: z.string().min(1),
});
