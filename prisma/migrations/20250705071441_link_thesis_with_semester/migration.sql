/*
  Warnings:

  - Added the required column `semester_id` to the `theses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "semesters" ADD COLUMN     "default_theses_per_lecturer" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "max_theses_per_lecturer" INTEGER NOT NULL DEFAULT 6;

-- AlterTable
ALTER TABLE "theses" ADD COLUMN     "semester_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "theses" ADD CONSTRAINT "theses_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
