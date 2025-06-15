/*
  Warnings:

  - You are about to drop the column `user_id` on the `theses` table. All the data in the column will be lost.
  - Added the required column `lecturer_id` to the `theses` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "theses" DROP CONSTRAINT "theses_user_id_fkey";

-- AlterTable
ALTER TABLE "theses" DROP COLUMN "user_id",
ADD COLUMN     "lecturer_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "theses" ADD CONSTRAINT "theses_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
