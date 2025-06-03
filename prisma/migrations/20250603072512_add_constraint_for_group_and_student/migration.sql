/*
  Warnings:

  - A unique constraint covering the columns `[leader_id,semester_id]` on the table `groups` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "groups_leader_id_semester_id_key" ON "groups"("leader_id", "semester_id");
