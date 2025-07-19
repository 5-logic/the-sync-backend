import { Module } from '@nestjs/common';

import {
	LecturerController,
	LecturerManagementController,
} from '@/domains/lecturers/controllers';
import {
	LecturerManagementService,
	LecturerService,
} from '@/lecturers/services';
import { EmailModule } from '@/queue';

@Module({
	imports: [EmailModule],
	controllers: [LecturerController, LecturerManagementController],
	providers: [LecturerManagementService, LecturerService],
})
export class LecturerModule {}
