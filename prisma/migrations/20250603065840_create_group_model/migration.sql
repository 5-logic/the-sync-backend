-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "project_description" TEXT,
    "required_skills" TEXT,
    "expected_roles" TEXT,
    "thesis_id" TEXT,
    "leader_id" TEXT NOT NULL,
    "semester_id" TEXT,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "groups_code_key" ON "groups"("code");

-- CreateIndex
CREATE UNIQUE INDEX "groups_thesis_id_key" ON "groups"("thesis_id");

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "theses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
