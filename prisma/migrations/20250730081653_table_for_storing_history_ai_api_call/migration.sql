-- CreateEnum
CREATE TYPE "AIAPIType" AS ENUM ('check_duplicate_thesis', 'suggest_thesis', 'suggest_participants');

-- CreateTable
CREATE TABLE "statistics_ai" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "type" "AIAPIType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "statistics_ai_pkey" PRIMARY KEY ("id")
);
