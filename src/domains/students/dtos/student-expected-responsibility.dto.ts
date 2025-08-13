import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';

import { ResponsibilityLevel } from '~/generated/prisma';

export class StudentResponsibilityDto {
	@ApiProperty()
	@IsUUID()
	responsibilityId: string;

	@ApiProperty({ enum: ResponsibilityLevel })
	@IsEnum(ResponsibilityLevel)
	level: ResponsibilityLevel;
}
