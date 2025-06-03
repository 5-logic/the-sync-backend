-- AlterTable
ALTER TABLE "admins" ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "majors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "majors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "majors_code_key" ON "majors"("code");
