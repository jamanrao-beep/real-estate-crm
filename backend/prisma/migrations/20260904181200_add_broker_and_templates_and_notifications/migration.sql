-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'BROKER';

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "plotImage" TEXT,
ADD COLUMN     "plotNumber" TEXT,
ADD COLUMN     "templateDetails" JSONB;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "aiChatHistory" JSONB,
ADD COLUMN     "brokerId" TEXT,
ADD COLUMN     "followUpAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
