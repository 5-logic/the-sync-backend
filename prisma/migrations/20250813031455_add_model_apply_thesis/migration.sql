-- CreateEnum
CREATE TYPE "ThesisApplicationStatus" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- CreateTable
CREATE TABLE "_thesis_applications" (
    "group_id" TEXT NOT NULL,
    "thesis_id" TEXT NOT NULL,
    "status" "ThesisApplicationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "_thesis_applications_pkey" PRIMARY KEY ("group_id","thesis_id")
);

-- AddForeignKey
ALTER TABLE "_thesis_applications" ADD CONSTRAINT "_thesis_applications_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_thesis_applications" ADD CONSTRAINT "_thesis_applications_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "theses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
