/*
  Warnings:

  - You are about to drop the `_group_expected_responsibilities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_group_required_skills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_student_expected_responsibilities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_student_skills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_thesis_required_skills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `skill_sets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `skills` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_group_expected_responsibilities" DROP CONSTRAINT "_group_expected_responsibilities_group_id_fkey";

-- DropForeignKey
ALTER TABLE "_group_expected_responsibilities" DROP CONSTRAINT "_group_expected_responsibilities_responsibility_id_fkey";

-- DropForeignKey
ALTER TABLE "_group_required_skills" DROP CONSTRAINT "_group_required_skills_group_id_fkey";

-- DropForeignKey
ALTER TABLE "_group_required_skills" DROP CONSTRAINT "_group_required_skills_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "_student_expected_responsibilities" DROP CONSTRAINT "_student_expected_responsibilities_responsibility_id_fkey";

-- DropForeignKey
ALTER TABLE "_student_expected_responsibilities" DROP CONSTRAINT "_student_expected_responsibilities_student_id_fkey";

-- DropForeignKey
ALTER TABLE "_student_skills" DROP CONSTRAINT "_student_skills_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "_student_skills" DROP CONSTRAINT "_student_skills_student_id_fkey";

-- DropForeignKey
ALTER TABLE "_thesis_required_skills" DROP CONSTRAINT "_thesis_required_skills_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "_thesis_required_skills" DROP CONSTRAINT "_thesis_required_skills_thesis_id_fkey";

-- DropForeignKey
ALTER TABLE "skills" DROP CONSTRAINT "skills_skill_set_id_fkey";

-- DropTable
DROP TABLE "_group_expected_responsibilities";

-- DropTable
DROP TABLE "_group_required_skills";

-- DropTable
DROP TABLE "_student_expected_responsibilities";

-- DropTable
DROP TABLE "_student_skills";

-- DropTable
DROP TABLE "_thesis_required_skills";

-- DropTable
DROP TABLE "skill_sets";

-- DropTable
DROP TABLE "skills";

-- CreateTable
CREATE TABLE "_student_responsibilities" (
    "student_id" TEXT NOT NULL,
    "responsibility_id" TEXT NOT NULL,
    "level" "skill_levels" NOT NULL DEFAULT 'beginner',

    CONSTRAINT "_student_responsibilities_pkey" PRIMARY KEY ("student_id","responsibility_id")
);

-- AddForeignKey
ALTER TABLE "_student_responsibilities" ADD CONSTRAINT "_student_responsibilities_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_student_responsibilities" ADD CONSTRAINT "_student_responsibilities_responsibility_id_fkey" FOREIGN KEY ("responsibility_id") REFERENCES "responsibilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
