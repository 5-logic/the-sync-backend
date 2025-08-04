/*
  Warnings:

  - Changed the type of `type` on the `statistics_ai` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ai_api_types" AS ENUM ('check_duplicate_thesis', 'suggest_thesis', 'suggest_participants');

-- AlterTable
ALTER TABLE "statistics_ai" DROP COLUMN "type",
ADD COLUMN     "type" "ai_api_types" NOT NULL;

-- DropEnum
DROP TYPE "AIAPIType";
