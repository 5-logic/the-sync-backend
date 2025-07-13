import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsEnum,
	IsNotEmpty,
	IsString,
	ValidateNested,
} from 'class-validator';

import { EnrollmentStatus } from '~/generated/prisma';

export class UpdateStudentEnrollmentDto {
	@ApiProperty({
		description: 'Student ID',
		example: 'student-uuid-1234',
	})
	@IsString()
	@IsNotEmpty()
	studentId: string;

	@ApiProperty({
		description: 'New enrollment status',
		enum: EnrollmentStatus,
		example: EnrollmentStatus.Passed,
	})
	@IsEnum(EnrollmentStatus)
	status: EnrollmentStatus;
}

export class UpdateEnrollmentsDto {
	@ApiProperty({
		description: 'List of student enrollment updates',
		type: [UpdateStudentEnrollmentDto],
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpdateStudentEnrollmentDto)
	enrollments: UpdateStudentEnrollmentDto[];
}
