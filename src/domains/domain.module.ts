import { Module } from '@nestjs/common';

import { AdminModule } from '@/admins/admin.module';
import { GroupModule } from '@/groups/group.module';
import { LecturerModule } from '@/lecturers/lecturer.module';
import { MilestoneModule } from '@/milestones/milestone.module';
import { SemesterModule } from '@/semesters/semester.module';
import { StudentModule } from '@/students/student.module';
import { ThesisModule } from '@/theses/thesis.module';

@Module({
	imports: [
		AdminModule,
		GroupModule,
		LecturerModule,
		MilestoneModule,
		SemesterModule,
		StudentModule,
		ThesisModule,
	],
})
export class DomainModule {}
