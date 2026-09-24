-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('CLUB', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "AthleticKind" AS ENUM ('VARSITY_TEAM', 'SPORTS_CLUB');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('EMAIL', 'WECHAT', 'PHONE', 'OTHER');

-- CreateEnum
CREATE TYPE "ClubMemberRole" AS ENUM ('MEMBER', 'MANAGER');

-- AlterEnum: ClubCategory drops SPORTS, adds PROFESSIONAL / ATHLETIC.
-- Existing SPORTS rows are remapped to ATHLETIC so no data is lost.
ALTER TYPE "ClubCategory" RENAME TO "ClubCategory_old";
CREATE TYPE "ClubCategory" AS ENUM ('ACADEMIC', 'ARTS', 'CULTURAL', 'SERVICE', 'SOCIAL', 'PROFESSIONAL', 'ATHLETIC', 'OTHER');

ALTER TABLE "clubs" ALTER COLUMN "category" TYPE "ClubCategory" USING (
  CASE WHEN "category"::text = 'SPORTS' THEN 'ATHLETIC' ELSE "category"::text END
)::"ClubCategory";

DROP TYPE "ClubCategory_old";

-- AlterTable
ALTER TABLE "clubs"
  ADD COLUMN "type" "GroupType" NOT NULL DEFAULT 'CLUB',
  ADD COLUMN "athleticKind" "AthleticKind",
  ADD COLUMN "sportName" TEXT,
  ADD COLUMN "contactMethod" "ContactMethod" NOT NULL DEFAULT 'EMAIL',
  ADD COLUMN "contactValue" TEXT,
  ADD COLUMN "contactQrUrl" TEXT,
  ADD COLUMN "website" TEXT,
  ADD COLUMN "openJoin" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "updatedAt" TIMESTAMP(3);

-- Carry the old free-text "contact" column into "contactValue".
UPDATE "clubs" SET "contactValue" = "contact";
UPDATE "clubs" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

ALTER TABLE "clubs" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "clubs" DROP COLUMN "contact";

-- CreateTable
CREATE TABLE "club_officers" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_officers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_memberships" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ClubMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "club_memberships_clubId_userId_key" ON "club_memberships"("clubId", "userId");

-- AddForeignKey
ALTER TABLE "club_officers" ADD CONSTRAINT "club_officers_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing club's original submitter becomes its manager.
INSERT INTO "club_memberships" ("id", "clubId", "userId", "role", "joinedAt")
SELECT md5(random()::text || clock_timestamp()::text || "id"), "id", "submittedById", 'MANAGER', "createdAt" FROM "clubs"
ON CONFLICT DO NOTHING;
