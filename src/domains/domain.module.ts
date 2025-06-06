import { Module } from '@nestjs/common';

import { GroupModule } from '@/groups/group.module';
import { MajorModule } from '@/majors/major.module';
import { MilestoneModule } from '@/milestones/milestone.module';
import { SemesterModule } from '@/semesters/semester.module';
import { ThesisModule } from '@/theses/thesis.module';

@Module({
	imports: [
		GroupModule,
		MajorModule,
		MilestoneModule,
		SemesterModule,
		ThesisModule,
	],
})
export class DomainModule {}
