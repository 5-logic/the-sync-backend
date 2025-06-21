import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsPositive } from 'class-validator';

import { CreateSemesterDto } from '@/semesters/dto/create-semester.dto';

import { OngoingPhase, SemesterStatus } from '~/generated/prisma';

export class UpdateSemesterDto extends PartialType(CreateSemesterDto) {
	@ApiPropertyOptional()
	@IsOptional()
	@IsPositive()
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
