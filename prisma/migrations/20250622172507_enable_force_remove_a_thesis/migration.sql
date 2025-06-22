-- DropForeignKey
ALTER TABLE "_supervisions" DROP CONSTRAINT "_supervisions_thesis_id_fkey";

-- DropForeignKey
ALTER TABLE "_thesis_required_skills" DROP CONSTRAINT "_thesis_required_skills_thesis_id_fkey";

-- DropForeignKey
ALTER TABLE "thesis_versions" DROP CONSTRAINT "thesis_versions_thesis_id_fkey";

-- AddForeignKey
ALTER TABLE "thesis_versions" ADD CONSTRAINT "thesis_versions_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_thesis_required_skills" ADD CONSTRAINT "_thesis_required_skills_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_supervisions" ADD CONSTRAINT "_supervisions_thesis_id_fkey" FOREIGN KEY ("thesis_id") REFERENCES "theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
