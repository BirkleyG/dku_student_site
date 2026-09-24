-- The widget vocabulary changed from generic "app + size" tiles to specific,
-- purpose-built widget kinds with their own config. Existing saved layouts
-- don't map onto the new kinds meaningfully, so this clears them — the app
-- falls back to a sensible default layout when a user has no saved rows.
DELETE FROM "dashboard_widgets";

-- CreateEnum
CREATE TYPE "WidgetKind" AS ENUM ('EVENTS_TALLY', 'EVENTS_AGENDA', 'EATS_OPEN_COUNT', 'EATS_FAVORITE', 'EATS_ORDER_TRACKER', 'EATS_ACTIVITY', 'BOARD_LATEST', 'BOARD_RECENT', 'BOARD_TRACKED_POST');

-- AlterTable
ALTER TABLE "dashboard_widgets" ADD COLUMN "kind" "WidgetKind" NOT NULL;
ALTER TABLE "dashboard_widgets" ADD COLUMN "config" JSONB;
ALTER TABLE "dashboard_widgets" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "dashboard_widgets" DROP COLUMN "type";
ALTER TABLE "dashboard_widgets" DROP COLUMN "size";

-- DropEnum
DROP TYPE "WidgetType";
DROP TYPE "WidgetSize";
