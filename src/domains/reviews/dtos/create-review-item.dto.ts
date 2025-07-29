import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID } from 'class-validator';

import { ChecklistReviewAcceptance } from '~/generated/prisma';

export class CreateReviewItemDto {
	@ApiProperty()
	@IsUUID()
	checklistItemId: string;

	@ApiProperty()
	@IsEnum(ChecklistReviewAcceptance)
	acceptance: ChecklistReviewAcceptance;

	@ApiPropertyOptional()
	@IsString()
	note?: string;
}
