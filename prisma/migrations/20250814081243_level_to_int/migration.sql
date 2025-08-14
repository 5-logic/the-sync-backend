/*
  Warnings:

  - The `level` column on the `_student_responsibilities` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."_student_responsibilities" DROP COLUMN "level",
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "public"."skill_levels";
