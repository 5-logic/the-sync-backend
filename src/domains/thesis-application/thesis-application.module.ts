import { Module } from '@nestjs/common';

import {
	ThesisApplicationLecturerController,
	ThesisApplicationStudentController,
} from '@/thesis-application/controllers';
import { ThesisApplicationService } from '@/thesis-application/services/thesis-application.service';

import {
	ThesisApplicationLecturerService,
	ThesisApplicationStudentService,
} from './services';

@Module({
	controllers: [
		ThesisApplicationStudentController,
		ThesisApplicationLecturerController,
	],
	providers: [
		ThesisApplicationLecturerService,
		ThesisApplicationStudentService,
		ThesisApplicationService,
	],
})
export class ThesisApplicationModule {}
