import { Module } from '@nestjs/common';

import { AdminModule } from '@/admins/index';
import { AIModule } from '@/ai/index';
import { ChecklistModule } from '@/checklists/checklist.module';
import { GroupModule } from '@/groups/group.module';
import { LecturerModule } from '@/lecturers/index';
import { MajorModule } from '@/majors/index';
import { MilestoneModule } from '@/milestones/milestone.module';
import { RequestModule } from '@/requests/request.module';
import { ResponsibilityModule } from '@/responsibilities/responsibility.module';
import { ReviewModule } from '@/reviews/review.module';
import { SemesterModule } from '@/semesters/index';
import { SkillSetModule } from '@/skill-sets/index';
import { StudentModule } from '@/students/index';
import { SubmissionModule } from '@/submissions/submission.module';
import { SupervisionModule } from '@/supervisions/supervision.module';
import { ThesisModule } from '@/theses/index';
import { ThesisApplicationModule } from '@/thesis-application/index';

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
		ThesisApplicationModule,
	],
})
export class DomainModule {}
