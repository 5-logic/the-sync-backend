/*
  Warnings:

  - The values [Rejecte,Approve] on the enum `ThesisStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ThesisStatus_new" AS ENUM ('New', 'Pending', 'Rejected', 'Approved');
ALTER TABLE "theses" ALTER COLUMN "status" TYPE "ThesisStatus_new" USING ("status"::text::"ThesisStatus_new");
ALTER TYPE "ThesisStatus" RENAME TO "ThesisStatus_old";
ALTER TYPE "ThesisStatus_new" RENAME TO "ThesisStatus";
DROP TYPE "ThesisStatus_old";
COMMIT;
