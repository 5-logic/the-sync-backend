import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateStudentDto } from '@/students/dto/create-student.dto';

export class UpdateStudentDto extends PartialType(
	OmitType(CreateStudentDto, [
		'email',
		'password',
		'studentId',
		'majorId',
		'semesterId',
	] as const),
) {}
