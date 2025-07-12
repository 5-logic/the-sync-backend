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

	@ApiProperty()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateReviewItemDto)
	reviewItems: CreateReviewItemDto[];
}
