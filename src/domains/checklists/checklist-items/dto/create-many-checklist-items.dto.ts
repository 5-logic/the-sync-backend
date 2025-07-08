import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { CreateChecklistItemDto } from './create-checklist-item.dto';

export class CreateManyChecklistItemsDto {
	@ApiProperty()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateChecklistItemDto)
	items: CreateChecklistItemDto[];
}
