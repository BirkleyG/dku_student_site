-- Map pins for Wisdom recommendations
ALTER TABLE "wisdom_recommendations" ADD COLUMN "address" TEXT;
ALTER TABLE "wisdom_recommendations" ADD COLUMN "lat" DOUBLE PRECISION;
ALTER TABLE "wisdom_recommendations" ADD COLUMN "lng" DOUBLE PRECISION;

-- Announcement Board
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "eventId" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "announcement_votes" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    CONSTRAINT "announcement_votes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "announcements_createdAt_idx" ON "announcements"("createdAt");
CREATE UNIQUE INDEX "announcement_votes_announcementId_userId_key" ON "announcement_votes"("announcementId", "userId");

ALTER TABLE "announcements" ADD CONSTRAINT "announcements_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "announcement_votes" ADD CONSTRAINT "announcement_votes_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "announcement_votes" ADD CONSTRAINT "announcement_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
