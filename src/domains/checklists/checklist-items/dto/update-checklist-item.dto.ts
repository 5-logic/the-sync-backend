import { PartialType } from '@nestjs/swagger';

import { CreateChecklistItemDto } from '@/checklists/checklist-items/dto/create-checklist-item.dto';

export class UpdateChecklistItemDto extends PartialType(
	CreateChecklistItemDto,
) {}
