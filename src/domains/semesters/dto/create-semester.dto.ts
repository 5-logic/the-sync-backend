import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

import { OngoingPhase, SemesterStatus } from '~/generated/prisma';

export class CreateSemesterDto {
	@ApiProperty()
	@IsString()
	code: string;

	@ApiProperty()
	@IsString()
	name: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsInt()
	maxGroup?: number;

	@ApiProperty({ enum: SemesterStatus })
	@IsEnum(SemesterStatus)
	status: SemesterStatus;

	@ApiPropertyOptional({ enum: OngoingPhase })
	@IsOptional()
	@IsEnum(OngoingPhase)
	ongoingPhase?: OngoingPhase;
}
