import { Module } from '@nestjs/common';

import {
	SemesterController,
	SemesterEnrollmentController,
} from '@/semesters/controllers';
import {
	SemesterEnrollmentService,
	SemesterNotificationService,
	SemesterService,
	SemesterStatusService,
} from '@/semesters/services';

@Module({
	controllers: [SemesterController, SemesterEnrollmentController],
	providers: [
		SemesterEnrollmentService,
		SemesterNotificationService,
		SemesterService,
		SemesterStatusService,
	],
})
export class SemesterModule {}
