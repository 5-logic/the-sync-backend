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
	description?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	projectDescription?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	projectDirection?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	requiredSkills?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	expectedRoles?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	thesisId?: string;

	@ApiProperty()
	@IsString()
	leaderId: string;

	@ApiProperty()
	@IsString()
	semesterId: string;
}
