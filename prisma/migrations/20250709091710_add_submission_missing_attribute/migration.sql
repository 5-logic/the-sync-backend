-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "documents" TEXT[] DEFAULT ARRAY[]::TEXT[];
