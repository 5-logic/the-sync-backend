import { Module } from '@nestjs/common';

import { AdminModule } from '@/admins/admin.module';
import { GroupModule } from '@/groups/group.module';
import { LecturerModule } from '@/lecturers/lecturer.module';
import { MajorModule } from '@/majors/major.module';
import { MilestoneModule } from '@/milestones/milestone.module';
import { SemesterModule } from '@/semesters/semester.module';
import { StudentModule } from '@/students/student.module';
import { ThesisModule } from '@/theses/thesis.module';

import { RequestModule } from '~/src/domains/requests/request.module';
import { SkillSetModule } from '~/src/domains/skill-sets/skill-set.module';
import { SupervisionModule } from '~/src/domains/supervisions/supervision.module';

@Module({
	imports: [
		AdminModule,
		GroupModule,
		LecturerModule,
		MajorModule,
		MilestoneModule,
		RequestModule,
		SemesterModule,
		SkillSetModule,
		StudentModule,
		SupervisionModule,
		ThesisModule,
	],
})
export class DomainModule {}
