import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsNotEmpty,
	IsString,
	IsUUID,
	ValidateNested,
} from 'class-validator';

import { CreateReviewItemDto } from './create-review-item.dto';

export class CreateReviewDto {
	@ApiProperty()
	@IsUUID()
	@IsNotEmpty()
	checklistId: string;

	@ApiPropertyOptional()
	@IsString()
	feedback?: string;

	@ApiProperty({
		example: [
			{
				checklistItemId: '123e4567-e89b-12d3-a456-426614174001',
				acceptance: 'Yes',
				note: 'Well done on this item.',
			},
		],
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateReviewItemDto)
	reviewItems: CreateReviewItemDto[];
}
