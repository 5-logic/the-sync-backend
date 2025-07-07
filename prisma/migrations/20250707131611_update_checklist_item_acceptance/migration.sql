/*
  Warnings:

  - You are about to drop the column `checklist_id` on the `milestones` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "milestones" DROP CONSTRAINT "milestones_checklist_id_fkey";

-- DropIndex
DROP INDEX "milestones_checklist_id_key";

-- AlterTable
ALTER TABLE "checklists" ALTER COLUMN "milestone_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "milestones" DROP COLUMN "checklist_id";

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
