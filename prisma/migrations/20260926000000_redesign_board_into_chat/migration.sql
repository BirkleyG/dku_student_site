-- The Board (BoardPost/BoardComment, a Reddit-style forum) is replaced by
-- Chat: one sitewide GENERAL channel, admin-created GROUP channels joined by
-- invite code, and 2-member DIRECT channels for DMs, with Slack-style
-- one-level-deep threaded replies. No production data existed for the old
-- Board tables, so this drops them rather than migrating rows.

-- CreateEnum
CREATE TYPE "ChatChannelKind" AS ENUM ('GENERAL', 'GROUP', 'DIRECT');

-- AlterEnum
BEGIN;
CREATE TYPE "AdminScope_new" AS ENUM ('EVENTS', 'CLUBS', 'SPORTS', 'NEWS', 'WISDOM', 'CHAT', 'EATS', 'SLB', 'COURSES', 'PROFESSORS');
ALTER TABLE "public"."users" ALTER COLUMN "adminScopes" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "adminScopes" TYPE "AdminScope_new"[] USING ("adminScopes"::text::"AdminScope_new"[]);
ALTER TYPE "AdminScope" RENAME TO "AdminScope_old";
ALTER TYPE "AdminScope_new" RENAME TO "AdminScope";
DROP TYPE "public"."AdminScope_old";
ALTER TABLE "users" ALTER COLUMN "adminScopes" SET DEFAULT ARRAY[]::"AdminScope"[];
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationCategory_new" AS ENUM ('EVENTS', 'MESSAGES', 'RECOMMENDATIONS', 'ORDERS');
ALTER TABLE "push_deliveries" ALTER COLUMN "category" TYPE "NotificationCategory_new" USING ("category"::text::"NotificationCategory_new");
ALTER TABLE "notification_preferences" ALTER COLUMN "category" TYPE "NotificationCategory_new" USING ("category"::text::"NotificationCategory_new");
ALTER TYPE "NotificationCategory" RENAME TO "NotificationCategory_old";
ALTER TYPE "NotificationCategory_new" RENAME TO "NotificationCategory";
DROP TYPE "public"."NotificationCategory_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ScoreReason_new" AS ENUM ('WISDOM_POST', 'CHAT_MESSAGE', 'CHAT_REPLY', 'PROFESSOR_REVIEW', 'COURSE_RESOURCE', 'COURSE_ADDED', 'PROFESSOR_ADDED', 'COURSE_COMMENT');
ALTER TABLE "score_events" ALTER COLUMN "reason" TYPE "ScoreReason_new" USING ("reason"::text::"ScoreReason_new");
ALTER TYPE "ScoreReason" RENAME TO "ScoreReason_old";
ALTER TYPE "ScoreReason_new" RENAME TO "ScoreReason";
DROP TYPE "public"."ScoreReason_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "WidgetKind_new" AS ENUM ('EVENTS_TALLY', 'EVENTS_AGENDA', 'EATS_OPEN_COUNT', 'EATS_FAVORITE', 'EATS_ORDER_TRACKER', 'EATS_ACTIVITY', 'CHAT_LATEST', 'CHAT_RECENT', 'CHAT_TRACKED_CHANNEL', 'LILYPAD_LATEST');
ALTER TABLE "dashboard_widgets" ALTER COLUMN "kind" TYPE "WidgetKind_new" USING ("kind"::text::"WidgetKind_new");
ALTER TYPE "WidgetKind" RENAME TO "WidgetKind_old";
ALTER TYPE "WidgetKind_new" RENAME TO "WidgetKind";
DROP TYPE "public"."WidgetKind_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "board_comments" DROP CONSTRAINT "board_comments_authorId_fkey";

-- DropForeignKey
ALTER TABLE "board_comments" DROP CONSTRAINT "board_comments_postId_fkey";

-- DropForeignKey
ALTER TABLE "board_posts" DROP CONSTRAINT "board_posts_authorId_fkey";

-- DropTable
DROP TABLE "board_comments";

-- DropTable
DROP TABLE "board_posts";

-- CreateTable
CREATE TABLE "chat_channels" (
    "id" TEXT NOT NULL,
    "kind" "ChatChannelKind" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "inviteCode" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_channel_members" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_channel_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_channels_inviteCode_key" ON "chat_channels"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "chat_channel_members_channelId_userId_key" ON "chat_channel_members"("channelId", "userId");

-- CreateIndex
CREATE INDEX "chat_messages_channelId_parentId_createdAt_idx" ON "chat_messages"("channelId", "parentId", "createdAt");

-- AddForeignKey
ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_channel_members" ADD CONSTRAINT "chat_channel_members_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "chat_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_channel_members" ADD CONSTRAINT "chat_channel_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "chat_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

