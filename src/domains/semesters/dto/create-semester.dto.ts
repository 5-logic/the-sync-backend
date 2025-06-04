import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateSemesterDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsString()
	code: string;

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

	@ApiProperty({ type: String, format: 'date-time' })
	@IsNotEmpty()
	@IsDateString()
	endRegistrationDate: string;
}
