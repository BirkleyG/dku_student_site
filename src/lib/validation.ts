import { z } from "zod";

// Allowed domains aren't sensitive, so this is deliberately a single NEXT_PUBLIC_
// var — keeping client and server validation reading the exact same value avoids
// them silently drifting apart if only one of two separate vars gets set.
export const studentEmailDomains = (process.env.NEXT_PUBLIC_STUDENT_EMAIL_DOMAINS ?? "dukekunshan.edu.cn,duke.edu")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

export const signupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  netId: z.string().trim().min(1, "NetID is required").max(40),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email")
    .refine((email) => studentEmailDomains.some((domain) => email.endsWith(`@${domain}`)), {
      message: `Use your ${studentEmailDomains.join(" or ")} email to sign up`,
    }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200),
  // Beta gate: a super-admin issues one per netID from the admin tab.
  inviteCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Invite code is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;

/** Trims and lowercases a netID so comparisons are consistent everywhere it's used. */
export function normalizeNetId(netId: string): string {
  return netId.trim().toLowerCase();
}

/**
 * True when `email` is exactly `<netId>@<an allowed student domain>`, so an
 * invite code issued for one netID can't be claimed with someone else's
 * email address. Case-insensitive and trims both sides first.
 */
export function emailMatchesNetId(email: string, netId: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedNetId = normalizeNetId(netId);
  if (!normalizedNetId) return false;
  return studentEmailDomains.some((domain) => normalizedEmail === `${normalizedNetId}@${domain}`);
}
