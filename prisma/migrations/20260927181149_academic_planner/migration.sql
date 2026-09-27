-- CreateEnum
CREATE TYPE "PlanSemester" AS ENUM ('FALL', 'SPRING');

-- CreateEnum
CREATE TYPE "PlanSession" AS ENUM ('SESSION_1', 'SESSION_2', 'FULL', 'MINI_TERM');

-- CreateEnum
CREATE TYPE "GenEdTag" AS ENUM ('COMMON_CORE_Y1', 'COMMON_CORE_Y2', 'COMMON_CORE_Y3', 'DISTRIBUTION_NAS', 'DISTRIBUTION_SS', 'DISTRIBUTION_ARHU', 'QUANTITATIVE_REASONING', 'WRITING', 'DUKE_FACULTY');

-- CreateTable
CREATE TABLE "academic_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "major" TEXT,
    "track" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_courses" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "semester" "PlanSemester" NOT NULL,
    "session" "PlanSession" NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT,
    "credits" TEXT,
    "isCrNc" BOOLEAN NOT NULL DEFAULT false,
    "genEdTags" "GenEdTag"[] DEFAULT ARRAY[]::"GenEdTag"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planned_courses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "academic_plans_userId_idx" ON "academic_plans"("userId");

-- CreateIndex
CREATE INDEX "planned_courses_planId_idx" ON "planned_courses"("planId");

-- AddForeignKey
ALTER TABLE "academic_plans" ADD CONSTRAINT "academic_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_courses" ADD CONSTRAINT "planned_courses_planId_fkey" FOREIGN KEY ("planId") REFERENCES "academic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
