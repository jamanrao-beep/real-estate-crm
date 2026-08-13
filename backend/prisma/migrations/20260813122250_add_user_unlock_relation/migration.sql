/*
  Warnings:

  - You are about to drop the column `correctionNotes` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `correctionRequested` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "correctionNotes",
DROP COLUMN "correctionRequested";

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_unlockedById_fkey" FOREIGN KEY ("unlockedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
