import { Module } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';
import { StudentController } from '@/students/student.controller';
import { StudentService } from '@/students/student.service';

@Module({
	controllers: [StudentController],
	providers: [StudentService, PrismaService],
})
export class StudentModule {}
