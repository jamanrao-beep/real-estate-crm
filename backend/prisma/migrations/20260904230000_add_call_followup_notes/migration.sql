-- AlterTable
ALTER TABLE "CallLog" ADD COLUMN     "followUpAt" TIMESTAMP(3),
ADD COLUMN     "followUpNotes" TEXT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "followUpNotes" TEXT;
