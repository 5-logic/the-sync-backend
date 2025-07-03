import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
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

	@ApiPropertyOptional({ type: [String] })
	@IsOptional()
	@IsArray()
	skillIds?: string[];

	@ApiPropertyOptional({ type: [String] })
	@IsOptional()
	@IsArray()
	responsibilityIds?: string[];
}
