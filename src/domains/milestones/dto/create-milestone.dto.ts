import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateMilestoneDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsString()
	name: string;

	@ApiProperty({ type: String, format: 'date-time' })
	@IsNotEmpty()
	@IsDateString()
	startDate: string;

	@ApiProperty({ type: String, format: 'date-time' })
	@IsNotEmpty()
	@IsDateString()
	endDate: string;

	@ApiProperty()
	@IsNotEmpty()
	@IsString()
	semesterId: string;
}
