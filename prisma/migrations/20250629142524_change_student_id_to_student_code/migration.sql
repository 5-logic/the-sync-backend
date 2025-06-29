/*
  Warnings:

  - You are about to drop the column `student_id` on the `students` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[student_code]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `student_code` to the `students` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_student_expected_responsibilities" DROP CONSTRAINT "_student_expected_responsibilities_student_id_fkey";

-- DropForeignKey
ALTER TABLE "_student_group_participations" DROP CONSTRAINT "_student_group_participations_student_id_fkey";

-- DropForeignKey
ALTER TABLE "_student_skills" DROP CONSTRAINT "_student_skills_student_id_fkey";

-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_student_id_fkey";

-- DropIndex
DROP INDEX "students_student_id_key";

-- AlterTable
ALTER TABLE "students" DROP COLUMN "student_id",
ADD COLUMN     "student_code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "students_student_code_key" ON "students"("student_code");

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_student_skills" ADD CONSTRAINT "_student_skills_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_student_expected_responsibilities" ADD CONSTRAINT "_student_expected_responsibilities_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_student_group_participations" ADD CONSTRAINT "_student_group_participations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
