import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsBoolean,
	IsEnum,
	IsOptional,
	IsString,
	IsUUID,
} from 'class-validator';

import { ChecklistReviewAcceptance } from '~/generated/prisma';

export class CreateChecklistItemDto {
	@ApiProperty()
	@IsString()
	name: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	description?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsEnum(ChecklistReviewAcceptance)
	acceptance?: ChecklistReviewAcceptance;

	@ApiPropertyOptional()
	@IsOptional()
	@IsBoolean()
	isRequired?: boolean;

	@ApiProperty()
	@IsUUID()
	checklistId: string;
}
