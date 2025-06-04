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

	@ApiPropertyOptional({ name: 'projectDescription' })
	@IsOptional()
	@IsString()
	projectDescription?: string;

	@ApiPropertyOptional({ name: 'projectDirection' })
	@IsOptional()
	@IsString()
	projectDirection?: string;

	@ApiPropertyOptional({ name: 'requiredSkills' })
	@IsOptional()
	@IsString()
	requiredSkills?: string;

	@ApiPropertyOptional({ name: 'expectedRoles' })
	@IsOptional()
	@IsString()
	expectedRoles?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	thesisId?: string;

	@ApiProperty()
	@IsString()
	semesterId: string;
}
