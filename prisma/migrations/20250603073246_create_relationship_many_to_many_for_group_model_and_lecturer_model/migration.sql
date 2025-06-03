-- CreateTable
CREATE TABLE "_supervisions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_supervisions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_supervisions_B_index" ON "_supervisions"("B");

-- AddForeignKey
ALTER TABLE "_supervisions" ADD CONSTRAINT "_supervisions_A_fkey" FOREIGN KEY ("A") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_supervisions" ADD CONSTRAINT "_supervisions_B_fkey" FOREIGN KEY ("B") REFERENCES "lecturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
