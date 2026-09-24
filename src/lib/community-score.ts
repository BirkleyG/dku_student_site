import type { ScoreReason } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const scorePoints: Record<ScoreReason, number> = {
  WISDOM_POST: 5,
  BOARD_POST: 5,
  BOARD_COMMENT: 2,
  PROFESSOR_REVIEW: 6,
  COURSE_RESOURCE: 8,
  COURSE_ADDED: 5,
  PROFESSOR_ADDED: 4,
};

export const scoreReasonLabels: Record<ScoreReason, string> = {
  WISDOM_POST: "Shared a Wisdom rec",
  BOARD_POST: "Posted on the Board",
  BOARD_COMMENT: "Replied on the Board",
  PROFESSOR_REVIEW: "Rated a professor",
  COURSE_RESOURCE: "Uploaded a course resource",
  COURSE_ADDED: "Added a course",
  PROFESSOR_ADDED: "Added a professor",
};

/** Credits a user's DKU Life community score and logs why. Fire-and-forget from API routes after the main write succeeds. */
export async function awardPoints(userId: string, reason: ScoreReason) {
  const points = scorePoints[reason];
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { communityScore: { increment: points } } }),
    prisma.scoreEvent.create({ data: { userId, reason, points } }),
  ]);
}
