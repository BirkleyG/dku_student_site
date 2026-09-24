-- CreateEnum
CREATE TYPE "AdminScope" AS ENUM ('EVENTS', 'CLUBS', 'SPORTS', 'NEWS', 'WISDOM', 'BOARD', 'EATS', 'SLB');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "adminScopes" "AdminScope"[] NOT NULL DEFAULT ARRAY[]::"AdminScope"[];

-- CreateTable
CREATE TABLE "invite_codes" (
    "id" TEXT NOT NULL,
    "netId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invite_codes_code_key" ON "invite_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "invite_codes_usedById_key" ON "invite_codes"("usedById");

-- CreateIndex
CREATE UNIQUE INDEX "invite_codes_netId_code_key" ON "invite_codes"("netId", "code");

-- AddForeignKey
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
