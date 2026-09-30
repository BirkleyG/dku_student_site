-- Friends (follow), birthdays, chat read state, @mentions and presence.

-- AlterEnum
ALTER TYPE "NotificationCategory" ADD VALUE 'FRIENDS';
ALTER TYPE "WidgetKind" ADD VALUE 'CHAT_UNREAD';
ALTER TYPE "WidgetKind" ADD VALUE 'CHAT_MENTIONS';
ALTER TYPE "WidgetKind" ADD VALUE 'FRIENDS_ONLINE';
ALTER TYPE "WidgetKind" ADD VALUE 'FRIENDS_ACTIVITY';
ALTER TYPE "WidgetKind" ADD VALUE 'FRIENDS_BIRTHDAYS';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "birthdayMonth" INTEGER,
ADD COLUMN "birthdayDay" INTEGER,
ADD COLUMN "showBirthday" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "shareActivity" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "showOnlineStatus" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "lastSeenAt" TIMESTAMP(3),
ADD COLUMN "friendsSeenAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_read_states" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_read_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_mentions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "follows_followingId_idx" ON "follows"("followingId");
CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON "follows"("followerId", "followingId");
CREATE UNIQUE INDEX "chat_read_states_userId_channelId_key" ON "chat_read_states"("userId", "channelId");
CREATE INDEX "chat_mentions_userId_readAt_idx" ON "chat_mentions"("userId", "readAt");
CREATE UNIQUE INDEX "chat_mentions_messageId_userId_key" ON "chat_mentions"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "follows" ADD CONSTRAINT "follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_read_states" ADD CONSTRAINT "chat_read_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_read_states" ADD CONSTRAINT "chat_read_states_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "chat_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_mentions" ADD CONSTRAINT "chat_mentions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_mentions" ADD CONSTRAINT "chat_mentions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Everyone starts fully caught up: without a baseline, the first unread count would be every message ever
-- sent in General. Baselines are "now" for the General channel and every chat a user already belongs to.
INSERT INTO "chat_read_states" ("id", "userId", "channelId", "lastReadAt")
SELECT md5(random()::text || u."id" || c."id"), u."id", c."id", CURRENT_TIMESTAMP
FROM "users" u
JOIN "chat_channels" c ON c."kind" = 'GENERAL'
UNION ALL
SELECT md5(random()::text || m."userId" || m."channelId"), m."userId", m."channelId", CURRENT_TIMESTAMP
FROM "chat_channel_members" m;
