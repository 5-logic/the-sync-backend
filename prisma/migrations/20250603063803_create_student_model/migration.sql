-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "roles" TEXT,
    "skills" TEXT,
    "academic_interests" TEXT,
    "major_id" TEXT NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_student_id_key" ON "students"("student_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "majors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
