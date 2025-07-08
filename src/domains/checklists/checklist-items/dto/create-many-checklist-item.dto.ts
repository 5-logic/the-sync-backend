import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsUUID, ValidateNested } from 'class-validator';

import { CreateChecklistItemDto } from '@/checklists/checklist-items/dto';

export class CreateManyChecklistItemsDto {
	@ApiProperty({
		type: String,
		description: 'Checklist ID applied to all items',
	})
	@IsUUID()
	checklistId: string;

	@ApiProperty({
		type: [CreateChecklistItemDto],
		description: 'Array of checklist items to create',
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateChecklistItemDto)
	checklistItems: CreateChecklistItemDto[];
}
