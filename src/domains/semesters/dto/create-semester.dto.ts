import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString } from 'class-validator';

export class CreateSemesterDto {
	@ApiProperty()
	@IsString()
	code: string;

	@ApiProperty()
	@IsString()
	name: string;

	@ApiProperty({ type: String, format: 'date-time' })
	@IsDateString()
	startDate: string;

	@ApiProperty({ type: String, format: 'date-time' })
	@IsDateString()
	endDate: string;

	@ApiProperty({ type: String, format: 'date-time' })
	@IsDateString()
	endRegistrationDate: string;
}
