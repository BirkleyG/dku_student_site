-- AlterEnum
ALTER TYPE "ChatChannelKind" ADD VALUE 'EATS_VENDOR';

-- AlterTable
ALTER TABLE "chat_channels" ADD COLUMN     "eatsCustomerId" TEXT,
ADD COLUMN     "eatsVendorId" TEXT,
ADD COLUMN     "eatsVendorSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "chat_channels_eatsVendorId_eatsCustomerId_key" ON "chat_channels"("eatsVendorId", "eatsCustomerId");

-- AddForeignKey
ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_eatsCustomerId_fkey" FOREIGN KEY ("eatsCustomerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

