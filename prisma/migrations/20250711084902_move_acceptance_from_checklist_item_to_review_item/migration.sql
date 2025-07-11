/*
  Warnings:

  - You are about to drop the column `acceptance` on the `checklist_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "_review_items" ADD COLUMN     "acceptance" "checklist_review_acceptances" NOT NULL DEFAULT 'not_available';

-- AlterTable
ALTER TABLE "checklist_items" DROP COLUMN "acceptance";
