-- CreateTable
CREATE TABLE "tracking_details" (
    "id" TEXT NOT NULL,
    "documents" JSONB,
    "group_id" TEXT NOT NULL,
    "milestone_id" TEXT NOT NULL,

    CONSTRAINT "tracking_details_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tracking_details" ADD CONSTRAINT "tracking_details_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_details" ADD CONSTRAINT "tracking_details_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
