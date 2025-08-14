-- CreateEnum
CREATE TYPE "public"."genders" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "public"."thesis_statuses" AS ENUM ('new', 'pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "public"."request_types" AS ENUM ('invite', 'join');

-- CreateEnum
CREATE TYPE "public"."request_statuses" AS ENUM ('cancelled', 'pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "public"."semester_statuses" AS ENUM ('not_yet', 'preparing', 'picking', 'ongoing', 'end');

-- CreateEnum
CREATE TYPE "public"."submission_statuses" AS ENUM ('not_submitted', 'submitted');

-- CreateEnum
CREATE TYPE "public"."ongoing_phases" AS ENUM ('scope_adjustable', 'scope_locked');

-- CreateEnum
CREATE TYPE "public"."enrollment_statuses" AS ENUM ('not_yet', 'failed', 'ongoing', 'passed');

-- CreateEnum
CREATE TYPE "public"."checklist_review_acceptances" AS ENUM ('accepted', 'rejected', 'not_available');

-- CreateEnum
CREATE TYPE "public"."ai_api_types" AS ENUM ('check_duplicate_thesis', 'suggest_thesis', 'suggest_participants');

-- CreateEnum
CREATE TYPE "public"."ThesisApplicationStatus" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- CreateTable
CREATE TABLE "public"."admins" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."semesters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "public"."semester_statuses" NOT NULL DEFAULT 'not_yet',
    "ongoing_phase" "public"."ongoing_phases",
    "default_theses_per_lecturer" INTEGER NOT NULL DEFAULT 4,
    "max_theses_per_lecturer" INTEGER NOT NULL DEFAULT 6,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."majors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "majors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "gender" "public"."genders" NOT NULL,
    "phone_number" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."students" (
    "user_id" TEXT NOT NULL,
    "student_code" TEXT NOT NULL,
    "major_id" TEXT NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."lecturers" (
    "user_id" TEXT NOT NULL,
    "is_moderator" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lecturers_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."groups" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "project_direction" TEXT,
    "semester_id" TEXT NOT NULL,
    "thesis_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."theses" (
    "id" TEXT NOT NULL,
    "english_name" TEXT NOT NULL,
    "vietnamese_name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "domain" TEXT,
    "status" "public"."thesis_statuses" NOT NULL DEFAULT 'new',
    "is_publish" BOOLEAN NOT NULL DEFAULT false,
    "group_id" TEXT,
    "lecturer_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."thesis_versions" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "supporting_document" TEXT NOT NULL,
    "thesis_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "thesis_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."milestones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "semester_id" TEXT NOT NULL,
    "note" TEXT,
    "documents" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."submissions" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "milestone_id" TEXT NOT NULL,
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "public"."submission_statuses" NOT NULL DEFAULT 'not_submitted',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" TEXT NOT NULL,
    "feedback" TEXT,
    "lecturer_id" TEXT NOT NULL,
    "checklist_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."checklists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "milestone_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."checklist_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "checklist_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."responsibilities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "responsibilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."requests" (
    "id" TEXT NOT NULL,
    "type" "public"."request_types" NOT NULL,
    "status" "public"."request_statuses" NOT NULL,
    "student_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."statistics_ai" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "type" "public"."ai_api_types" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "statistics_ai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_student_responsibilities" (
    "student_id" TEXT NOT NULL,
    "responsibility_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "_student_responsibilities_pkey" PRIMARY KEY ("student_id","responsibility_id")
);

-- CreateTable
CREATE TABLE "public"."_enrollments" (
    "student_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "status" "public"."enrollment_statuses" NOT NULL DEFAULT 'not_yet',

    CONSTRAINT "_enrollments_pkey" PRIMARY KEY ("student_id","semester_id")
);

-- CreateTable
CREATE TABLE "public"."_review_items" (
    "review_id" TEXT NOT NULL,
    "checklistitem_id" TEXT NOT NULL,
    "acceptance" "public"."checklist_review_acceptances" NOT NULL DEFAULT 'not_available',
    "note" TEXT,

    CONSTRAINT "_review_items_pkey" PRIMARY KEY ("review_id","checklistitem_id")
);

-- CreateTable
CREATE TABLE "public"."_supervisions" (
    "lecturer_id" TEXT NOT NULL,
    "thesis_id" TEXT NOT NULL,

    CONSTRAINT "_supervisions_pkey" PRIMARY KEY ("thesis_id","lecturer_id")
);

-- CreateTable
CREATE TABLE "public"."_assignment_reviews" (
    "reviewer_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "is_main_reviewer" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "_assignment_reviews_pkey" PRIMARY KEY ("submission_id","reviewer_id")
);

-- CreateTable
CREATE TABLE "public"."_student_group_participations" (
    "student_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "is_leader" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "_student_group_participations_pkey" PRIMARY KEY ("student_id","group_id","semester_id")
);

-- CreateTable
CREATE TABLE "public"."_thesis_applications" (
    "group_id" TEXT NOT NULL,
    "thesis_id" TEXT NOT NULL,
    "status" "public"."ThesisApplicationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "_thesis_applications_pkey" PRIMARY KEY ("group_id","thesis_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "public"."admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_name_key" ON "public"."semesters"("name");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_code_key" ON "public"."semesters"("code");

-- CreateIndex
CREATE UNIQUE INDEX "majors_code_key" ON "public"."majors"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_student_code_key" ON "public"."students"("student_code");

-- CreateIndex
CREATE UNIQUE INDEX "groups_code_key" ON "public"."groups"("code");

-- CreateIndex
CREATE UNIQUE INDEX "groups_thesis_id_key" ON "public"."groups"("thesis_id");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_group_id_milestone_id_key" ON "public"."submissions"("group_id", "milestone_id");

-- CreateIndex
CREATE UNIQUE INDEX "checklists_milestone_id_key" ON "public"."checklists"("milestone_id");

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "public"."majors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lecturers" ADD CONSTRAINT "lecturers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."groups" ADD CONSTRAINT "groups_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."groups" ADD CONSTRAINT "groups_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "public"."theses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."theses" ADD CONSTRAINT "theses_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "public"."lecturers"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."theses" ADD CONSTRAINT "theses_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."thesis_versions" ADD CONSTRAINT "thesis_versions_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "public"."theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."milestones" ADD CONSTRAINT "milestones_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."submissions" ADD CONSTRAINT "submissions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."submissions" ADD CONSTRAINT "submissions_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "public"."lecturers"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "public"."checklists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."checklists" ADD CONSTRAINT "checklists_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."checklist_items" ADD CONSTRAINT "checklist_items_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "public"."checklists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."requests" ADD CONSTRAINT "requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."requests" ADD CONSTRAINT "requests_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_student_responsibilities" ADD CONSTRAINT "_student_responsibilities_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_student_responsibilities" ADD CONSTRAINT "_student_responsibilities_responsibility_id_fkey" FOREIGN KEY ("responsibility_id") REFERENCES "public"."responsibilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_enrollments" ADD CONSTRAINT "_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_enrollments" ADD CONSTRAINT "_enrollments_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_review_items" ADD CONSTRAINT "_review_items_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_review_items" ADD CONSTRAINT "_review_items_checklistitem_id_fkey" FOREIGN KEY ("checklistitem_id") REFERENCES "public"."checklist_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_supervisions" ADD CONSTRAINT "_supervisions_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "public"."lecturers"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_supervisions" ADD CONSTRAINT "_supervisions_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "public"."theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_assignment_reviews" ADD CONSTRAINT "_assignment_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."lecturers"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_assignment_reviews" ADD CONSTRAINT "_assignment_reviews_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_student_group_participations" ADD CONSTRAINT "_student_group_participations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_student_group_participations" ADD CONSTRAINT "_student_group_participations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_student_group_participations" ADD CONSTRAINT "_student_group_participations_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_thesis_applications" ADD CONSTRAINT "_thesis_applications_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_thesis_applications" ADD CONSTRAINT "_thesis_applications_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "public"."theses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
