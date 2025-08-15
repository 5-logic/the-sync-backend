-- CreateEnum
CREATE TYPE "thesis_orientations" AS ENUM ('se', 'ai', 'neutral');

-- AlterTable
ALTER TABLE "theses" ADD COLUMN     "orientation" "thesis_orientations" NOT NULL DEFAULT 'neutral';
