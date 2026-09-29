import { z } from "zod";

// Allowed domains aren't sensitive, so this is deliberately a single NEXT_PUBLIC_
// var — keeping client and server validation reading the exact same value avoids
// them silently drifting apart if only one of two separate vars gets set.
// duke.edu comes first: it's the NetID-based address we tell students to sign
// up with (see the signup copy), and it's also what Welcome.tsx's
// conversational signup builds `${netId}@${studentEmailDomains[0]}` from.
export const studentEmailDomains = (process.env.NEXT_PUBLIC_STUDENT_EMAIL_DOMAINS ?? "duke.edu,dukekunshan.edu.cn")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

export const signupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  netId: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "NetID is required")
    .max(40)
    .regex(/^[a-z0-9._-]+$/, "NetID can only contain letters and numbers"),
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

/** The account email is always derived from the NetID: `<netid>@duke.edu`. */
export function emailFromNetId(netId: string): string {
  return `${normalizeNetId(netId)}@${studentEmailDomains[0]}`;
}
