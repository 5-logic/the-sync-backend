-- DropForeignKey
ALTER TABLE "_enrollments" DROP CONSTRAINT "_enrollments_student_id_fkey";

-- AddForeignKey
ALTER TABLE "_enrollments" ADD CONSTRAINT "_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
