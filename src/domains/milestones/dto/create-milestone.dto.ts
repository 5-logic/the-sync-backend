import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsUUID } from 'class-validator';

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
	@IsUUID()
	semesterId: string;
}
