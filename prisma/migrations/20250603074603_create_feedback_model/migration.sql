-- CreateTable
CREATE TABLE "feedbacks" (
    "tracking_detail_id" TEXT NOT NULL,
    "lecturer_id" TEXT NOT NULL,
    "detail" TEXT NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("tracking_detail_id","lecturer_id")
);

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_tracking_detail_id_fkey" FOREIGN KEY ("tracking_detail_id") REFERENCES "tracking_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
