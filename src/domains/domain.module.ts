import { Module } from '@nestjs/common';

import { AdminModule } from '@/admins/admin.module';
import { LecturerModule } from '@/lecturers/lecturer.module';
import { SemesterModule } from '@/semesters/semester.module';
import { StudentModule } from '@/students/student.module';
import { UserModule } from '@/users/user.module';

@Module({
	imports: [
		AdminModule,
		UserModule,
		LecturerModule,
		StudentModule,
		SemesterModule,
	],
})
export class DomainModule {}
