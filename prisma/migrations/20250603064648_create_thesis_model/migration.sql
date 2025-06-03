-- CreateEnum
CREATE TYPE "ThesisStatus" AS ENUM ('New', 'Pending', 'Rejecte', 'Approve');

-- CreateTable
CREATE TABLE "theses" (
    "id" TEXT NOT NULL,
    "english_name" TEXT NOT NULL,
    "vietnamese_name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "supporting_document" TEXT NOT NULL,
    "status" "ThesisStatus" NOT NULL,
    "expected_outcome" TEXT,
    "required_skills" TEXT,
    "suggested_technologies" TEXT,
    "domain" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "theses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "theses" ADD CONSTRAINT "theses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
