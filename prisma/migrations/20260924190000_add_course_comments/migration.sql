-- AlterEnum
ALTER TYPE "CourseResourceType" ADD VALUE 'MATERIALS';

-- AlterEnum
ALTER TYPE "ScoreReason" ADD VALUE 'COURSE_COMMENT';

-- CreateTable
CREATE TABLE "course_comments" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "course_comments" ADD CONSTRAINT "course_comments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_comments" ADD CONSTRAINT "course_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
