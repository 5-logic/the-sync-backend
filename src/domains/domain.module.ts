import { Module } from '@nestjs/common';

import { AdminModule } from '@/admins/admin.module';
import { GroupModule } from '@/groups/group.module';
import { LecturerModule } from '@/lecturers/lecturer.module';
import { MajorModule } from '@/majors/major.module';
import { MilestoneModule } from '@/milestones/milestone.module';
import { RequestsModule } from '@/requests/requests.module';
import { SemesterModule } from '@/semesters/semester.module';
import { SkillSetsModule } from '@/skill-sets/skill-sets.module';
import { StudentModule } from '@/students/student.module';
import { SupervisionsModule } from '@/supervisions/supervisions.module';
import { ThesisModule } from '@/theses/thesis.module';

@Module({
	imports: [
		AdminModule,
		GroupModule,
		LecturerModule,
		MajorModule,
		MilestoneModule,
		RequestsModule,
		SemesterModule,
		SkillSetsModule,
		StudentModule,
		SupervisionsModule,
		ThesisModule,
	],
})
export class DomainModule {}
