import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateSemesterDto {
	@ApiProperty()
	@IsString()
	code: string;

	@ApiProperty()
	@IsString()
	name: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsPositive()
	defaultThesesPerLecturer?: number;

	@ApiPropertyOptional()
	@IsOptional()
	@IsPositive()
	maxThesesPerLecturer?: number;
}
