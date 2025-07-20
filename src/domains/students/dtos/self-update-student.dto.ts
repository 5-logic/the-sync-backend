import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { CreateStudentDto } from '@/students/dtos/create-student.dto';
import { StudentExpectedResponsibilityDto } from '@/students/dtos/student-expected-responsibility.dto';
import { StudentSkillDto } from '@/students/dtos/student-skill.dto';

export class SelfUpdateStudentDto extends PartialType(
	OmitType(CreateStudentDto, [
		'email',
		'studentCode',
		'majorId',
		'semesterId',
	] as const),
) {
	@ApiPropertyOptional({ type: [StudentSkillDto] })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => StudentSkillDto)
	studentSkills?: StudentSkillDto[];

	@ApiPropertyOptional({
		type: [StudentExpectedResponsibilityDto],
	})
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => StudentExpectedResponsibilityDto)
	studentExpectedResponsibilities?: StudentExpectedResponsibilityDto[];
}
