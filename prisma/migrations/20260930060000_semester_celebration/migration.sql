-- AlterEnum
ALTER TYPE "NotificationCategory" ADD VALUE 'ACADEMIC';

-- CreateTable
CREATE TABLE "semester_celebrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "semesterKey" TEXT NOT NULL,
    "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissedAt" TIMESTAMP(3),

    CONSTRAINT "semester_celebrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "semester_celebrations_userId_semesterKey_key" ON "semester_celebrations"("userId", "semesterKey");

-- AddForeignKey
ALTER TABLE "semester_celebrations" ADD CONSTRAINT "semester_celebrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
