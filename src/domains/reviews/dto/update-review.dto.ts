import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';

import { UpdateReviewItemDto } from './update-review-item.dto';

export class UpdateReviewDto {
	@ApiPropertyOptional()
	@IsString()
	feedback?: string;

	@ApiPropertyOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpdateReviewItemDto)
	reviewItems?: UpdateReviewItemDto[];
}
