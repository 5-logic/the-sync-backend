import { Module } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';
import { EmailModule } from '@/queue/email/email.module';
import { StudentController } from '@/students/student.controller';
import { StudentService } from '@/students/student.service';

@Module({
	imports: [EmailModule],
	controllers: [StudentController],
	providers: [StudentService, PrismaService],
})
export class StudentModule {}
