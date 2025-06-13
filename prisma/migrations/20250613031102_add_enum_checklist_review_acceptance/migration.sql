/*
  Warnings:

  - A unique constraint covering the columns `[checklist_id]` on the table `milestones` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "checklist_review_acceptances" AS ENUM ('accepted', 'rejected', 'not_available');

-- DropForeignKey
ALTER TABLE "checklists" DROP CONSTRAINT "checklists_milestone_id_fkey";

-- AlterTable
ALTER TABLE "checklist_items" ADD COLUMN     "acceptance" "checklist_review_acceptances" NOT NULL DEFAULT 'not_available';

-- AlterTable
ALTER TABLE "milestones" ADD COLUMN     "checklist_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "milestones_checklist_id_key" ON "milestones"("checklist_id");

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "checklists"("id") ON DELETE SET NULL ON UPDATE CASCADE;
