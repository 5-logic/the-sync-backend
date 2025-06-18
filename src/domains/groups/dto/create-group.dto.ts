import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
	@ApiProperty()
	@IsString()
	code: string;

	@ApiProperty()
	@IsString()
	name: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	projectDirection?: string;

	@ApiProperty()
	@IsString()
	semesterId: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	thesisId?: string;
}
