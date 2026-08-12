-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "unlockedAt" TIMESTAMP(3),
ADD COLUMN     "unlockedById" TEXT;
