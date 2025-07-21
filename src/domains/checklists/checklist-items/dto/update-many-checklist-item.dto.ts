import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';

import { UpdateChecklistItemDto } from '@/checklists/checklist-items/dto';

export class UpdateChecklistItemWithIdDto extends UpdateChecklistItemDto {
	@ApiProperty({
		type: String,
		description: 'ID of the checklist item to update',
	})
	@IsString()
	id: string;
}

export class UpdateManyChecklistItemsDto {
	@ApiProperty({ type: [UpdateChecklistItemWithIdDto] })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpdateChecklistItemWithIdDto)
	items: UpdateChecklistItemWithIdDto[];
}
