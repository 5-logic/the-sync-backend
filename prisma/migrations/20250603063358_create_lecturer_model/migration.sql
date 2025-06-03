-- CreateTable
CREATE TABLE "lecturers" (
    "id" TEXT NOT NULL,
    "is_moderator" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lecturers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "lecturers" ADD CONSTRAINT "lecturers_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
