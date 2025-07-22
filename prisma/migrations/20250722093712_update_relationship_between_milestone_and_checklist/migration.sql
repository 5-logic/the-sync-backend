/*
  Warnings:

  - A unique constraint covering the columns `[milestone_id]` on the table `checklists` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "checklists_milestone_id_key" ON "checklists"("milestone_id");
