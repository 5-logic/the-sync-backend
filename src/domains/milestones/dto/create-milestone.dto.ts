import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateMilestoneDto {
	@ApiProperty()
	@IsString()
	name: string;

	@ApiProperty()
	@IsDateString()
	startDate: Date;

	@ApiProperty()
	@IsDateString()
	endDate: Date;

	@ApiProperty()
	@IsString()
	semesterId: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	checklistId?: string;
}
