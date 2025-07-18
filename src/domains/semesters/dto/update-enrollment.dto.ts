import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsUUID, ValidateNested } from 'class-validator';

import { EnrollmentStatus } from '~/generated/prisma';

export class UpdateStudentEnrollmentDto {
	@ApiProperty()
	@IsUUID()
	studentId: string;

	@ApiProperty({ enum: EnrollmentStatus })
	@IsEnum(EnrollmentStatus)
	status: EnrollmentStatus;
}

export class UpdateEnrollmentsDto {
	@ApiProperty({
		type: [UpdateStudentEnrollmentDto],
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpdateStudentEnrollmentDto)
	enrollments: UpdateStudentEnrollmentDto[];
}
