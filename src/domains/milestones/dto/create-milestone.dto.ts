import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString } from 'class-validator';

export class CreateMilestoneDto {
	@ApiProperty()
	@IsString()
	name: string;

	@ApiProperty({ type: String, format: 'date-time' })
	@IsDateString()
	startDate: string;

	@ApiProperty({ type: String, format: 'date-time' })
	@IsDateString()
	endDate: string;

	@ApiProperty()
	@IsString()
	semesterId: string;
}
