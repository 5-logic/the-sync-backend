import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export enum SemesterStatus {
	NotYet = 'NotYet',
	Preparing = 'Preparing',
	Picking = 'Picking',
	Ongoing = 'Ongoing',
	End = 'End',
}

export enum OngoingPhase {
	ScopeAdjustable = 'ScopeAdjustable',
	ScopeLocked = 'ScopeLocked',
}

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
