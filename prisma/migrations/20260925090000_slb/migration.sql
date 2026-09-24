-- CreateEnum
CREATE TYPE "SlbInitiativeStatus" AS ENUM ('PROPOSED', 'IN_PROGRESS', 'PASSED', 'NOT_PASSED');

-- CreateTable
CREATE TABLE "slb_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slb_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slb_about" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slb_about_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slb_announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slb_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slb_polls" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "closesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slb_polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slb_poll_options" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "slb_poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slb_poll_votes" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slb_poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slb_initiatives" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "SlbInitiativeStatus" NOT NULL DEFAULT 'PROPOSED',
    "sponsorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slb_initiatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slb_initiative_backers" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slb_initiative_backers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slb_initiative_votes" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "slb_initiative_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "slb_members_userId_key" ON "slb_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "slb_poll_votes_pollId_userId_key" ON "slb_poll_votes"("pollId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "slb_initiative_backers_initiativeId_userId_key" ON "slb_initiative_backers"("initiativeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "slb_initiative_votes_initiativeId_userId_key" ON "slb_initiative_votes"("initiativeId", "userId");

-- AddForeignKey
ALTER TABLE "slb_members" ADD CONSTRAINT "slb_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slb_about" ADD CONSTRAINT "slb_about_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slb_announcements" ADD CONSTRAINT "slb_announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slb_polls" ADD CONSTRAINT "slb_polls_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slb_poll_options" ADD CONSTRAINT "slb_poll_options_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "slb_polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slb_poll_votes" ADD CONSTRAINT "slb_poll_votes_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "slb_polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slb_poll_votes" ADD CONSTRAINT "slb_poll_votes_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "slb_poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slb_poll_votes" ADD CONSTRAINT "slb_poll_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slb_initiatives" ADD CONSTRAINT "slb_initiatives_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slb_initiative_backers" ADD CONSTRAINT "slb_initiative_backers_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "slb_initiatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slb_initiative_backers" ADD CONSTRAINT "slb_initiative_backers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slb_initiative_votes" ADD CONSTRAINT "slb_initiative_votes_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "slb_initiatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slb_initiative_votes" ADD CONSTRAINT "slb_initiative_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

