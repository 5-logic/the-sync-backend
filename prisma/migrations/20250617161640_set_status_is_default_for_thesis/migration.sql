-- AlterTable
ALTER TABLE "admins" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "theses" ALTER COLUMN "status" SET DEFAULT 'new';
