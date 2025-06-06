import { Module } from '@nestjs/common';

import { AdminModule } from '@/admins/admin.module';
import { LecturerModule } from '@/lecturers/lecturer.module';
import { MajorModule } from '@/majors/major.module';
import { StudentModule } from '@/students/student.module';
import { ThesisModule } from '@/theses/thesis.module';
import { UserModule } from '@/users/user.module';

@Module({
	imports: [
		ThesisModule,
		MajorModule,
		AdminModule,
		UserModule,
		LecturerModule,
		StudentModule,
	],
})
export class DomainModule {}
