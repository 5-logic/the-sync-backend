import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { CreateStudentDto } from '@/students/dto/create-student.dto';
import { StudentExpectedResponsibilityDto } from '@/students/dto/student-expected-responsibility.dto';
import { StudentSkillDto } from '@/students/dto/student-skill.dto';

export class SelfUpdateStudentDto extends PartialType(
	OmitType(CreateStudentDto, [
		'email',
		'studentCode',
		'majorId',
		'semesterId',
	] as const),
) {
	@ApiProperty({ type: [StudentSkillDto], required: false })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => StudentSkillDto)
	studentSkills?: StudentSkillDto[];

	@ApiProperty({ type: [StudentExpectedResponsibilityDto], required: false })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => StudentExpectedResponsibilityDto)
	studentExpectedResponsibilities?: StudentExpectedResponsibilityDto[];
}
