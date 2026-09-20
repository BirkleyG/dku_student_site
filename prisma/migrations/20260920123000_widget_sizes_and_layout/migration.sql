-- AlterEnum
ALTER TYPE "WidgetType" ADD VALUE 'MARKETPLACE';
ALTER TYPE "WidgetType" ADD VALUE 'SLB';

-- CreateEnum
CREATE TYPE "WidgetSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- DropIndex
DROP INDEX "dashboard_widgets_userId_type_key";

-- AlterTable
ALTER TABLE "dashboard_widgets" ADD COLUMN "size" "WidgetSize" NOT NULL DEFAULT 'MEDIUM';
