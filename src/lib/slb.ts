import { z } from "zod";
import type { AdminScope, Role, SlbInitiativeStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";

export const SLB_OFFICIAL_URL = "https://campus-life.dukekunshan.edu.cn/student-leader-board/home/";

export const INITIATIVE_STATUS: Record<SlbInitiativeStatus, { label: string; className: string }> = {
  PROPOSED: { label: "Proposed", className: "bg-gold/15 text-ink" },
  IN_PROGRESS: { label: "In progress", className: "bg-sprout/40 text-sprout-deep" },
  PASSED: { label: "Passed", className: "bg-sprout-deep text-white" },
  NOT_PASSED: { label: "Not passed", className: "bg-ink/10 text-ink/60" },
};

export type SlbViewer = {
  id: string;
  firstName: string;
  role: Role;
  adminScopes: AdminScope[];
  /** On the board: can post announcements, polls, initiatives and back initiatives. */
  isMember: boolean;
  /** Site admin or holder of the SLB admin scope: can manage members and moderate. */
  canManage: boolean;
};

/** The logged-in user with their SLB permissions, or null when logged out. */
export async function getSlbViewer(): Promise<SlbViewer | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, firstName: true, role: true, adminScopes: true, slbMembership: { select: { id: true } } },
  });
  if (!user) return null;
  const canManage = hasScope(user, "SLB");
  return {
    id: user.id,
    firstName: user.firstName,
    role: user.role,
    adminScopes: user.adminScopes,
    isMember: Boolean(user.slbMembership),
    canManage,
  };
}

/** Members and managers can publish; managers count so an admin can seed content. */
export function canPublish(viewer: SlbViewer | null): viewer is SlbViewer {
  return Boolean(viewer && (viewer.isMember || viewer.canManage));
}

export const announcementSchema = z.object({
  title: z.string().trim().min(3, "Give it a title").max(140),
  body: z.string().trim().min(10, "Say a bit more").max(8000),
});

export const pollSchema = z.object({
  question: z.string().trim().min(5, "Ask a full question").max(200),
  options: z
    .array(z.string().trim().min(1).max(100))
    .min(2, "Add at least two options")
    .max(8, "Up to eight options")
    .refine((opts) => new Set(opts.map((o) => o.toLowerCase())).size === opts.length, "Options must be different"),
  closesAt: z.coerce.date().optional().nullable(),
});

export const initiativeSchema = z.object({
  title: z.string().trim().min(5, "Give it a clear title").max(140),
  summary: z.string().trim().min(10, "One or two sentences on what it does").max(300),
  body: z.string().trim().min(20, "Lay out the full agenda").max(20000),
});

export const aboutSchema = z.object({ body: z.string().trim().min(10).max(20000) });

export const memberSchema = z.object({
  netIdOrEmail: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2, "Add a title, e.g. President").max(60),
});

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}
