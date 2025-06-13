/*
  Warnings:

  - You are about to drop the `assignment_reviews` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `group_expected_responsibilities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `group_required_skills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `review_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_expected_responsibilities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_skills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supervisions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `thesis_required_skills` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "assignment_reviews" DROP CONSTRAINT "assignment_reviews_reviewer_id_fkey";

-- DropForeignKey
ALTER TABLE "assignment_reviews" DROP CONSTRAINT "assignment_reviews_submission_id_fkey";

-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_semester_id_fkey";

-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_student_id_fkey";

-- DropForeignKey
ALTER TABLE "group_expected_responsibilities" DROP CONSTRAINT "group_expected_responsibilities_Responsibility_id_fkey";

-- DropForeignKey
ALTER TABLE "group_expected_responsibilities" DROP CONSTRAINT "group_expected_responsibilities_group_id_fkey";

-- DropForeignKey
ALTER TABLE "group_required_skills" DROP CONSTRAINT "group_required_skills_group_id_fkey";

-- DropForeignKey
ALTER TABLE "group_required_skills" DROP CONSTRAINT "group_required_skills_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "review_items" DROP CONSTRAINT "review_items_checklistitem_id_fkey";

-- DropForeignKey
ALTER TABLE "review_items" DROP CONSTRAINT "review_items_review_id_fkey";

-- DropForeignKey
ALTER TABLE "student_expected_responsibilities" DROP CONSTRAINT "student_expected_responsibilities_Responsibility_id_fkey";

-- DropForeignKey
ALTER TABLE "student_expected_responsibilities" DROP CONSTRAINT "student_expected_responsibilities_student_id_fkey";

-- DropForeignKey
ALTER TABLE "student_skills" DROP CONSTRAINT "student_skills_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "student_skills" DROP CONSTRAINT "student_skills_student_id_fkey";

-- DropForeignKey
ALTER TABLE "supervisions" DROP CONSTRAINT "supervisions_lecturer_id_fkey";

-- DropForeignKey
ALTER TABLE "supervisions" DROP CONSTRAINT "supervisions_thesis_id_fkey";

-- DropForeignKey
ALTER TABLE "thesis_required_skills" DROP CONSTRAINT "thesis_required_skills_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "thesis_required_skills" DROP CONSTRAINT "thesis_required_skills_thesis_id_fkey";

-- DropTable
DROP TABLE "assignment_reviews";

-- DropTable
DROP TABLE "enrollments";

-- DropTable
DROP TABLE "group_expected_responsibilities";

-- DropTable
DROP TABLE "group_required_skills";

-- DropTable
DROP TABLE "review_items";

-- DropTable
DROP TABLE "student_expected_responsibilities";

-- DropTable
DROP TABLE "student_skills";

-- DropTable
DROP TABLE "supervisions";

-- DropTable
DROP TABLE "thesis_required_skills";

-- CreateTable
CREATE TABLE "_student_skills" (
    "student_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "level" "skill_levels" NOT NULL,

    CONSTRAINT "_student_skills_pkey" PRIMARY KEY ("student_id","skill_id")
);

-- CreateTable
CREATE TABLE "_group_required_skills" (
    "group_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,

    CONSTRAINT "_group_required_skills_pkey" PRIMARY KEY ("group_id","skill_id")
);

-- CreateTable
CREATE TABLE "_thesis_required_skills" (
    "thesis_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,

    CONSTRAINT "_thesis_required_skills_pkey" PRIMARY KEY ("thesis_id","skill_id")
);

-- CreateTable
CREATE TABLE "_student_expected_responsibilities" (
    "student_id" TEXT NOT NULL,
    "Responsibility_id" TEXT NOT NULL,

    CONSTRAINT "_student_expected_responsibilities_pkey" PRIMARY KEY ("student_id","Responsibility_id")
);

-- CreateTable
CREATE TABLE "_group_expected_responsibilities" (
    "group_id" TEXT NOT NULL,
    "Responsibility_id" TEXT NOT NULL,

    CONSTRAINT "_group_expected_responsibilities_pkey" PRIMARY KEY ("group_id","Responsibility_id")
);

-- CreateTable
CREATE TABLE "_enrollments" (
    "student_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "status" "enrollment_statuses" NOT NULL,

    CONSTRAINT "_enrollments_pkey" PRIMARY KEY ("student_id","semester_id")
);

-- CreateTable
CREATE TABLE "_review_items" (
    "review_id" TEXT NOT NULL,
    "checklistitem_id" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "_review_items_pkey" PRIMARY KEY ("review_id","checklistitem_id")
);

-- CreateTable
CREATE TABLE "_supervisions" (
    "lecturer_id" TEXT NOT NULL,
    "thesis_id" TEXT NOT NULL,

    CONSTRAINT "_supervisions_pkey" PRIMARY KEY ("thesis_id","lecturer_id")
);

-- CreateTable
CREATE TABLE "_assignment_reviews" (
    "reviewer_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,

    CONSTRAINT "_assignment_reviews_pkey" PRIMARY KEY ("submission_id","reviewer_id")
);

-- AddForeignKey
ALTER TABLE "_student_skills" ADD CONSTRAINT "_student_skills_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_student_skills" ADD CONSTRAINT "_student_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_group_required_skills" ADD CONSTRAINT "_group_required_skills_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_group_required_skills" ADD CONSTRAINT "_group_required_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_thesis_required_skills" ADD CONSTRAINT "_thesis_required_skills_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "theses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_thesis_required_skills" ADD CONSTRAINT "_thesis_required_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_student_expected_responsibilities" ADD CONSTRAINT "_student_expected_responsibilities_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_student_expected_responsibilities" ADD CONSTRAINT "_student_expected_responsibilities_Responsibility_id_fkey" FOREIGN KEY ("Responsibility_id") REFERENCES "responsibilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_group_expected_responsibilities" ADD CONSTRAINT "_group_expected_responsibilities_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_group_expected_responsibilities" ADD CONSTRAINT "_group_expected_responsibilities_Responsibility_id_fkey" FOREIGN KEY ("Responsibility_id") REFERENCES "responsibilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_enrollments" ADD CONSTRAINT "_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_enrollments" ADD CONSTRAINT "_enrollments_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_review_items" ADD CONSTRAINT "_review_items_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_review_items" ADD CONSTRAINT "_review_items_checklistitem_id_fkey" FOREIGN KEY ("checklistitem_id") REFERENCES "checklist_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_supervisions" ADD CONSTRAINT "_supervisions_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_supervisions" ADD CONSTRAINT "_supervisions_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "theses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_assignment_reviews" ADD CONSTRAINT "_assignment_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "lecturers"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_assignment_reviews" ADD CONSTRAINT "_assignment_reviews_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
