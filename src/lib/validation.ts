import { z } from "zod";

const studentDomain = process.env.STUDENT_EMAIL_DOMAIN ?? "dukekunshan.edu.cn";

export const signupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  netId: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email")
    .refine((email) => email.endsWith(`@${studentDomain}`), {
      message: `Use your ${studentDomain} email to sign up`,
    }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200),
});

export type SignupInput = z.infer<typeof signupSchema>;
