-- CreateEnum
CREATE TYPE "CourseExamType" AS ENUM ('MIDTERM', 'FINAL', 'OTHER');

-- AlterTable
ALTER TABLE "course_resources" ADD COLUMN "fileName" TEXT,
ADD COLUMN "professorId" TEXT,
ADD COLUMN "examType" "CourseExamType";

-- AddForeignKey
ALTER TABLE "course_resources" ADD CONSTRAINT "course_resources_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "professors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
