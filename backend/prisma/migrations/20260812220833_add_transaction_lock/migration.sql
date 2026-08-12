-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "correctionNotes" TEXT,
ADD COLUMN     "correctionRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT true;
