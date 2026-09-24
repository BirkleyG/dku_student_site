-- AlterTable
ALTER TABLE "users" ADD COLUMN "starredNav" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
