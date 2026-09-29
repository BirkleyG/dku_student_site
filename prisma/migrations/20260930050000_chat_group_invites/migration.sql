-- CreateEnum
CREATE TYPE "ChatInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "chat_group_invites" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "status" "ChatInviteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_group_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_group_invites_channelId_inviteeId_key" ON "chat_group_invites"("channelId", "inviteeId");

-- CreateIndex
CREATE INDEX "chat_group_invites_inviteeId_status_idx" ON "chat_group_invites"("inviteeId", "status");

-- AddForeignKey
ALTER TABLE "chat_group_invites" ADD CONSTRAINT "chat_group_invites_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "chat_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_group_invites" ADD CONSTRAINT "chat_group_invites_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_group_invites" ADD CONSTRAINT "chat_group_invites_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
