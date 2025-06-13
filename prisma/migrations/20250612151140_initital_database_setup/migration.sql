-- CreateEnum
CREATE TYPE "genders" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "thesis_statuses" AS ENUM ('new', 'pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "skill_levels" AS ENUM ('beginner', 'intermediate', 'proficient', 'advanced', 'expert');

-- CreateEnum
CREATE TYPE "request_types" AS ENUM ('invite', 'join');

-- CreateEnum
CREATE TYPE "request_statuses" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "semester_statuses" AS ENUM ('not_yet', 'preparing', 'picking', 'ongoing', 'end');

-- CreateEnum
CREATE TYPE "ongoing_phases" AS ENUM ('scope_adjustable', 'scope_locked');

-- CreateEnum
CREATE TYPE "enrollment_statuses" AS ENUM ('failed', 'ongoing', 'passed');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semesters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "max_group" INTEGER,
    "status" "semester_statuses" NOT NULL,
    "ongoing_phase" "ongoing_phases",

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "majors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "majors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "gender" "genders" NOT NULL,
    "phone_number" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "user_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "major_id" TEXT NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "lecturers" (
    "user_id" TEXT NOT NULL,
    "is_moderator" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lecturers_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "project_direction" TEXT,
    "semester_id" TEXT NOT NULL,
    "thesis_id" TEXT,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theses" (
    "id" TEXT NOT NULL,
    "english_name" TEXT NOT NULL,
    "vietnamese_name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "domain" TEXT,
    "status" "thesis_statuses" NOT NULL,
    "is_publish" BOOLEAN NOT NULL DEFAULT false,
    "group_id" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "theses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thesis_versions" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "supporting_document" TEXT NOT NULL,
    "thesis_id" TEXT NOT NULL,

    CONSTRAINT "thesis_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "semester_id" TEXT NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "milestone_id" TEXT NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "feedback" TEXT,
    "lecturer_id" TEXT NOT NULL,
    "checklist_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "milestone_id" TEXT NOT NULL,

    CONSTRAINT "checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "checklist_id" TEXT NOT NULL,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skill_set_id" TEXT NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_sets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "skill_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responsibilities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "responsibilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" TEXT NOT NULL,
    "type" "request_types" NOT NULL,
    "status" "request_statuses" NOT NULL,
    "student_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_skills" (
    "student_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "level" "skill_levels" NOT NULL,

    CONSTRAINT "student_skills_pkey" PRIMARY KEY ("student_id","skill_id")
);

-- CreateTable
CREATE TABLE "group_required_skills" (
    "group_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,

    CONSTRAINT "group_required_skills_pkey" PRIMARY KEY ("group_id","skill_id")
);

-- CreateTable
CREATE TABLE "thesis_required_skills" (
    "thesis_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,

    CONSTRAINT "thesis_required_skills_pkey" PRIMARY KEY ("thesis_id","skill_id")
);

-- CreateTable
CREATE TABLE "student_expected_responsibilities" (
    "student_id" TEXT NOT NULL,
    "Responsibility_id" TEXT NOT NULL,

    CONSTRAINT "student_expected_responsibilities_pkey" PRIMARY KEY ("student_id","Responsibility_id")
);

-- CreateTable
CREATE TABLE "group_expected_responsibilities" (
    "group_id" TEXT NOT NULL,
    "Responsibility_id" TEXT NOT NULL,

    CONSTRAINT "group_expected_responsibilities_pkey" PRIMARY KEY ("group_id","Responsibility_id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "student_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "status" "enrollment_statuses" NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("student_id","semester_id")
);

-- CreateTable
CREATE TABLE "review_items" (
    "review_id" TEXT NOT NULL,
    "checklistitem_id" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "review_items_pkey" PRIMARY KEY ("review_id","checklistitem_id")
);

-- CreateTable
CREATE TABLE "supervisions" (
    "lecturer_id" TEXT NOT NULL,
    "thesis_id" TEXT NOT NULL,

    CONSTRAINT "supervisions_pkey" PRIMARY KEY ("thesis_id","lecturer_id")
);

-- CreateTable
CREATE TABLE "assignment_reviews" (
    "reviewer_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,

    CONSTRAINT "assignment_reviews_pkey" PRIMARY KEY ("submission_id","reviewer_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_name_key" ON "semesters"("name");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_code_key" ON "semesters"("code");

-- CreateIndex
CREATE UNIQUE INDEX "majors_code_key" ON "majors"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_student_id_key" ON "students"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "groups_code_key" ON "groups"("code");

-- CreateIndex
CREATE UNIQUE INDEX "groups_thesis_id_key" ON "groups"("thesis_id");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_group_id_milestone_id_key" ON "submissions"("group_id", "milestone_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "majors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturers" ADD CONSTRAINT "lecturers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "theses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thesis_versions" ADD CONSTRAINT "thesis_versions_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "theses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "checklists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_skill_set_id_fkey" FOREIGN KEY ("skill_set_id") REFERENCES "skill_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_required_skills" ADD CONSTRAINT "group_required_skills_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_required_skills" ADD CONSTRAINT "group_required_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thesis_required_skills" ADD CONSTRAINT "thesis_required_skills_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "theses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thesis_required_skills" ADD CONSTRAINT "thesis_required_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_expected_responsibilities" ADD CONSTRAINT "student_expected_responsibilities_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_expected_responsibilities" ADD CONSTRAINT "student_expected_responsibilities_Responsibility_id_fkey" FOREIGN KEY ("Responsibility_id") REFERENCES "responsibilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_expected_responsibilities" ADD CONSTRAINT "group_expected_responsibilities_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_expected_responsibilities" ADD CONSTRAINT "group_expected_responsibilities_Responsibility_id_fkey" FOREIGN KEY ("Responsibility_id") REFERENCES "responsibilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_checklistitem_id_fkey" FOREIGN KEY ("checklistitem_id") REFERENCES "checklist_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisions" ADD CONSTRAINT "supervisions_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisions" ADD CONSTRAINT "supervisions_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "theses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_reviews" ADD CONSTRAINT "assignment_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "lecturers"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_reviews" ADD CONSTRAINT "assignment_reviews_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
