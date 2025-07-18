import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsUUID } from 'class-validator';

import { EnrollmentStatus } from '~/generated/prisma';

export class UpdateEnrollmentsDto {
	@ApiProperty()
	@IsArray()
	@IsUUID(4, { each: true })
	studentIds: string[];

	@ApiProperty({ enum: [EnrollmentStatus.Passed, EnrollmentStatus.Failed] })
	@IsIn([EnrollmentStatus.Passed, EnrollmentStatus.Failed])
	status: EnrollmentStatus;
}
