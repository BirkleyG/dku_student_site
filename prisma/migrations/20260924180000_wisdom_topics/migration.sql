-- Wisdom moves from flat, single-author recommendation posts to
-- topics (e.g. "Best Western food near campus") that anyone can add
-- recommendations to and vote on. The old flat structure doesn't map onto
-- topics + recommendations, so this drops the old data.
DROP TABLE "wisdom_votes";
DROP TABLE "wisdom_posts";

-- CreateTable
CREATE TABLE "wisdom_topics" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "WisdomCategory" NOT NULL DEFAULT 'OTHER',
    "requireLocation" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wisdom_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wisdom_recommendations" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "placeName" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wisdom_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wisdom_votes" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "wisdom_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wisdom_votes_recommendationId_userId_key" ON "wisdom_votes"("recommendationId", "userId");

-- AddForeignKey
ALTER TABLE "wisdom_topics" ADD CONSTRAINT "wisdom_topics_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wisdom_recommendations" ADD CONSTRAINT "wisdom_recommendations_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "wisdom_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wisdom_recommendations" ADD CONSTRAINT "wisdom_recommendations_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wisdom_votes" ADD CONSTRAINT "wisdom_votes_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "wisdom_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wisdom_votes" ADD CONSTRAINT "wisdom_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
