-- DropForeignKey
ALTER TABLE "_student_expected_responsibilities" DROP CONSTRAINT "_student_expected_responsibilities_student_id_fkey";

-- DropForeignKey
ALTER TABLE "_student_group_participations" DROP CONSTRAINT "_student_group_participations_student_id_fkey";

-- DropForeignKey
ALTER TABLE "_student_skills" DROP CONSTRAINT "_student_skills_student_id_fkey";

-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_student_id_fkey";

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_student_skills" ADD CONSTRAINT "_student_skills_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_student_expected_responsibilities" ADD CONSTRAINT "_student_expected_responsibilities_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_student_group_participations" ADD CONSTRAINT "_student_group_participations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
