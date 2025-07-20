import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateStudentDto } from '@/students/dtos/create-student.dto';

export class UpdateStudentDto extends PartialType(
	OmitType(CreateStudentDto, ['semesterId'] as const),
) {}
