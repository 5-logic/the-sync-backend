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

	@ApiPropertyOptional({ enum: SemesterStatus, default: SemesterStatus.NotYet })
	@IsOptional()
	@IsEnum(SemesterStatus)
	status?: SemesterStatus;

	@ApiPropertyOptional({
		enum: OngoingPhase,
		default: OngoingPhase.ScopeAdjustable,
	})
	@IsOptional()
	@IsEnum(OngoingPhase)
	ongoingPhase?: OngoingPhase;
}
