-- CreateEnum
CREATE TYPE "WisdomCategory" AS ENUM ('FOOD', 'NIGHTLIFE', 'ACTIVITIES', 'TRAVEL', 'STUDY', 'OTHER');

-- CreateEnum
CREATE TYPE "ClubCategory" AS ENUM ('ACADEMIC', 'ARTS', 'SPORTS', 'CULTURAL', 'SERVICE', 'SOCIAL', 'OTHER');

-- CreateTable
CREATE TABLE "board_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wisdom_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "WisdomCategory" NOT NULL,
    "location" TEXT,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wisdom_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wisdom_votes" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "wisdom_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_signups" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_signups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ClubCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "contact" TEXT,
    "logoUrl" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "submittedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wisdom_votes_postId_userId_key" ON "wisdom_votes"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_signups_email_key" ON "newsletter_signups"("email");

-- AddForeignKey
ALTER TABLE "board_posts" ADD CONSTRAINT "board_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_comments" ADD CONSTRAINT "board_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "board_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_comments" ADD CONSTRAINT "board_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wisdom_posts" ADD CONSTRAINT "wisdom_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wisdom_votes" ADD CONSTRAINT "wisdom_votes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "wisdom_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wisdom_votes" ADD CONSTRAINT "wisdom_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
