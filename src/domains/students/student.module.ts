import { Module } from '@nestjs/common';

import { EmailModule } from '@/queue/email/email.module';
import { StudentController } from '@/students/student.controller';
import { StudentService } from '@/students/student.service';
import { UserService } from '@/users/user.service';

@Module({
	imports: [EmailModule],
	controllers: [StudentController],
	providers: [StudentService, UserService],
})
export class StudentModule {}
