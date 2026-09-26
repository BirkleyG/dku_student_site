-- AlterTable
ALTER TABLE "users" ADD COLUMN "starredNavMobile" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
