-- The News tab is now a live sync from The Lilypad's own site (no more
-- admin-authored articles or newsletter signups), and there's a new
-- dashboard widget kind to surface it.

-- AlterEnum
ALTER TYPE "WidgetKind" ADD VALUE 'LILYPAD_LATEST';

-- DropForeignKey
ALTER TABLE "news_posts" DROP CONSTRAINT IF EXISTS "news_posts_authorId_fkey";

-- DropTable
DROP TABLE "news_posts";

-- DropTable
DROP TABLE "newsletter_signups";
