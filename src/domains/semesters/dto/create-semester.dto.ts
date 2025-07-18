import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateSemesterDto {
	@ApiProperty()
	@IsString()
	code: string;

	@ApiProperty()
	@IsString()
	name: string;

	@ApiPropertyOptional()
	@IsNumber()
	maxGroup?: number;

	@ApiPropertyOptional()
	@IsNumber()
	defaultThesesPerLecturer?: number;

	@ApiPropertyOptional()
	@IsNumber()
	maxThesesPerLecturer?: number;
}
