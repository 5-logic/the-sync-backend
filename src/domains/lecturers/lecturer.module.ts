import { Module } from '@nestjs/common';

import { LecturerController } from '@/domains/lecturers/lecturer.controller';
import { EmailModule } from '@/queue/email/email.module';

import { LecturerService } from '~/src/domains/lecturers/services/lecturer.service';

@Module({
	imports: [EmailModule],
	controllers: [LecturerController],
	providers: [LecturerService],
})
export class LecturerModule {}
