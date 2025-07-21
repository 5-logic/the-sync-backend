import { Module } from '@nestjs/common';

import {
	StudentAdminController,
	StudentPublicController,
	StudentSelfController,
} from '@/students/controllers';
import {
	StudentAdminService,
	StudentPublicService,
	StudentSelfService,
} from '@/students/services';

@Module({
	controllers: [
		StudentAdminController,
		StudentPublicController,
		StudentSelfController,
	],
	providers: [StudentAdminService, StudentPublicService, StudentSelfService],
})
export class StudentModule {}
