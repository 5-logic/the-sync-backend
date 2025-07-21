import { Module } from '@nestjs/common';

import { AdminModule } from '@/admins/admin.module';
import { AIModule } from '@/ai/ai.module';
import { ChecklistModule } from '@/checklists/checklist.module';
import { GroupModule } from '@/groups/group.module';
import { LecturerModule } from '@/lecturers/lecturer.module';
import { MajorModule } from '@/majors/major.module';
import { MilestoneModule } from '@/milestones/milestone.module';
import { RequestModule } from '@/requests/request.module';
import { ResponsibilityModule } from '@/responsibilities/responsibility.module';
import { ReviewModule } from '@/reviews/review.module';
import { SemesterModule } from '@/semesters/semester.module';
import { SkillSetModule } from '@/skill-sets/skill-set.module';
import { StudentModule } from '@/students/student.module';
import { SubmissionModule } from '@/submissions/submission.module';
import { SupervisionModule } from '@/supervisions/supervision.module';
import { ThesisModule } from '@/theses/thesis.module';

@Module({
	imports: [
		AdminModule,
		AIModule,
		ChecklistModule,
		GroupModule,
		LecturerModule,
		MajorModule,
		MilestoneModule,
		RequestModule,
		ResponsibilityModule,
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
