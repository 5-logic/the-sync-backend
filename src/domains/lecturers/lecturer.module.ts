import { Module } from '@nestjs/common';

import { LecturerController } from '@/domains/lecturers/lecturer.controller';
import { LecturerService } from '@/domains/lecturers/lecturer.service';
import { EmailModule } from '@/queue/email/email.module';
import { UserService } from '@/users/user.service';

@Module({
	imports: [EmailModule],
	controllers: [LecturerController],
	providers: [LecturerService, UserService],
})
export class LecturerModule {}
