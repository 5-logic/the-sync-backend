import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsUrl } from 'class-validator';

export class CreateThesisDto {
	@ApiProperty()
	@IsString()
	englishName: string;

	@ApiProperty()
	@IsString()
	vietnameseName: string;

	@ApiProperty()
	@IsString()
	abbreviation: string;

	@ApiProperty()
	@IsString()
	description: string;

	@ApiPropertyOptional()
	@IsOptional()
	domain?: string;

	@ApiProperty()
	@IsUrl()
	supportingDocument: string;

	@ApiProperty()
	@IsUUID()
	semesterId: string;
}
