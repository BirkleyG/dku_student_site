-- CreateEnum
CREATE TYPE "EventKind" AS ENUM ('EVENT', 'DEADLINE', 'HOLIDAY');

-- AlterTable (additive, backward compatible: existing rows are timed events)
ALTER TABLE "events" ADD COLUMN "allDay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "kind" "EventKind" NOT NULL DEFAULT 'EVENT';
