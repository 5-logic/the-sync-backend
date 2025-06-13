/*
  Warnings:

  - The primary key for the `_group_expected_responsibilities` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `Responsibility_id` on the `_group_expected_responsibilities` table. All the data in the column will be lost.
  - The primary key for the `_student_expected_responsibilities` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `Responsibility_id` on the `_student_expected_responsibilities` table. All the data in the column will be lost.
  - Added the required column `responsibility_id` to the `_group_expected_responsibilities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responsibility_id` to the `_student_expected_responsibilities` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_group_expected_responsibilities" DROP CONSTRAINT "_group_expected_responsibilities_Responsibility_id_fkey";

-- DropForeignKey
ALTER TABLE "_student_expected_responsibilities" DROP CONSTRAINT "_student_expected_responsibilities_Responsibility_id_fkey";

-- AlterTable
ALTER TABLE "_group_expected_responsibilities" DROP CONSTRAINT "_group_expected_responsibilities_pkey",
DROP COLUMN "Responsibility_id",
ADD COLUMN     "responsibility_id" TEXT NOT NULL,
ADD CONSTRAINT "_group_expected_responsibilities_pkey" PRIMARY KEY ("group_id", "responsibility_id");

-- AlterTable
ALTER TABLE "_student_expected_responsibilities" DROP CONSTRAINT "_student_expected_responsibilities_pkey",
DROP COLUMN "Responsibility_id",
ADD COLUMN     "responsibility_id" TEXT NOT NULL,
ADD CONSTRAINT "_student_expected_responsibilities_pkey" PRIMARY KEY ("student_id", "responsibility_id");

-- AddForeignKey
ALTER TABLE "_student_expected_responsibilities" ADD CONSTRAINT "_student_expected_responsibilities_responsibility_id_fkey" FOREIGN KEY ("responsibility_id") REFERENCES "responsibilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_group_expected_responsibilities" ADD CONSTRAINT "_group_expected_responsibilities_responsibility_id_fkey" FOREIGN KEY ("responsibility_id") REFERENCES "responsibilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
