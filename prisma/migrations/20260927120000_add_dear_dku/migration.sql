-- AlterEnum
ALTER TYPE "AdminScope" ADD VALUE 'DEARDKU';

-- CreateEnum
CREATE TYPE "DearDkuCategory" AS ENUM ('OPINION', 'ESSAY', 'CREATIVE_WRITING', 'ART', 'CAMPUS_LIFE', 'OTHER');

-- CreateEnum
CREATE TYPE "DearDkuSubmissionType" AS ENUM ('GOOGLE_DOC', 'FILE');

-- CreateTable
CREATE TABLE "dear_dku_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" "DearDkuCategory" NOT NULL DEFAULT 'OTHER',
    "submissionType" "DearDkuSubmissionType" NOT NULL DEFAULT 'GOOGLE_DOC',
    "docUrl" TEXT,
    "fileUrl" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dear_dku_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dear_dku_comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dear_dku_comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "dear_dku_posts" ADD CONSTRAINT "dear_dku_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dear_dku_comments" ADD CONSTRAINT "dear_dku_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "dear_dku_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dear_dku_comments" ADD CONSTRAINT "dear_dku_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
