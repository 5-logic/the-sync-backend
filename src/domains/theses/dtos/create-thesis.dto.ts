import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsUrl } from 'class-validator';

import { ThesisOrientation } from '~/generated/prisma';

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

	@ApiPropertyOptional({ enum: ThesisOrientation })
	@IsOptional()
	@IsEnum(ThesisOrientation)
	orientation?: ThesisOrientation;

	@ApiProperty()
	@IsUrl()
	supportingDocument: string;

	@ApiProperty()
	@IsUUID()
	semesterId: string;
}
