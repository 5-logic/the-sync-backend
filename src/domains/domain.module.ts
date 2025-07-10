import { Module } from '@nestjs/common';

import { AdminModule } from '@/admins/admin.module';
import { ChecklistModule } from '@/checklists/checklist.module';
import { RequestModule } from '@/domains/requests/request.module';
import { SkillSetModule } from '@/domains/skill-sets/skill-set.module';
import { SupervisionModule } from '@/domains/supervisions/supervision.module';
import { GroupModule } from '@/groups/group.module';
import { LecturerModule } from '@/lecturers/lecturer.module';
import { MajorModule } from '@/majors/major.module';
import { MilestoneModule } from '@/milestones/milestone.module';
import { ResponsibilityModule } from '@/responsibilities/responsibility.module';
import { ReviewModule } from '@/reviews/review.module';
import { SemesterModule } from '@/semesters/semester.module';
import { StudentModule } from '@/students/student.module';
import { SubmissionModule } from '@/submissions/submission.module';
import { ThesisModule } from '@/theses/thesis.module';

@Module({
	imports: [
		AdminModule,
		ChecklistModule,
		GroupModule,
		LecturerModule,
		MajorModule,
		MilestoneModule,
		ResponsibilityModule,
		RequestModule,
		ReviewModule,
		SemesterModule,
		SkillSetModule,
		StudentModule,
		SubmissionModule,
		SupervisionModule,
		ThesisModule,
	],
})
export class DomainModule {}
