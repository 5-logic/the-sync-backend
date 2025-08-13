import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { CreateStudentDto } from '@/students/dtos/create-student.dto';
import { StudentResponsibilityDto } from '@/students/dtos/student-expected-responsibility.dto';

export class SelfUpdateStudentDto extends PartialType(
	OmitType(CreateStudentDto, [
		'email',
		'studentCode',
		'majorId',
		'semesterId',
	] as const),
) {
	@ApiPropertyOptional({
		type: [StudentResponsibilityDto],
	})
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => StudentResponsibilityDto)
	studentResponsibilities?: StudentResponsibilityDto[];
}
