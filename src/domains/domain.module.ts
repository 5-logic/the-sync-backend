import { Module } from '@nestjs/common';

import { AdminModule } from '@/admins/admin.module';
import { ChecklistsModule } from '@/checklists/checklists.module';
import { RequestModule } from '@/domains/requests/request.module';
import { SkillSetModule } from '@/domains/skill-sets/skill-set.module';
import { SupervisionModule } from '@/domains/supervisions/supervision.module';
import { GroupModule } from '@/groups/group.module';
import { LecturerModule } from '@/lecturers/lecturer.module';
import { MajorModule } from '@/majors/major.module';
import { MilestoneModule } from '@/milestones/milestone.module';
import { ReponsibilityModule } from '@/responsibilities/responsibility.module';
import { SemesterModule } from '@/semesters/semester.module';
import { StudentModule } from '@/students/student.module';
import { ThesisModule } from '@/theses/thesis.module';

@Module({
	imports: [
		AdminModule,
		ChecklistsModule,
		GroupModule,
		LecturerModule,
		MajorModule,
		MilestoneModule,
		ReponsibilityModule,
		RequestModule,
		SemesterModule,
		SkillSetModule,
		StudentModule,
		SupervisionModule,
		ThesisModule,
	],
})
export class DomainModule {}
