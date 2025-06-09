import { Module } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma.service';
import { StudentController } from '@/students/student.controller';
import { StudentService } from '@/students/student.service';
import { UserService } from '@/users/user.service';

@Module({
	controllers: [StudentController],
	providers: [StudentService, PrismaService, UserService],
})
export class StudentModule {}
