-- AlterTable
ALTER TABLE "academic_plans" ADD COLUMN "miniTermCompleted" BOOLEAN NOT NULL DEFAULT false;

-- Plans that already had a course in the old Mini-Term slot count as completed.
UPDATE "academic_plans" SET "miniTermCompleted" = true
WHERE "id" IN (SELECT "planId" FROM "planned_courses" WHERE "session" = 'MINI_TERM');

-- The Mini-Term slot is gone from the planner; the checkbox replaces it.
DELETE FROM "planned_courses" WHERE "session" = 'MINI_TERM';
