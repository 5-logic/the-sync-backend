-- AlterTable
ALTER TABLE "milestones" ADD COLUMN     "documents" TEXT[] DEFAULT ARRAY[]::TEXT[];
