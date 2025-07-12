-- CreateEnum
CREATE TYPE "submission_statuses" AS ENUM ('not_submitted', 'submitted');

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "status" "submission_statuses" NOT NULL DEFAULT 'not_submitted';
