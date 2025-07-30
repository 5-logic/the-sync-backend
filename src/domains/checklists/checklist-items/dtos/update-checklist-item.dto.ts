import { PartialType } from '@nestjs/swagger';

import { CreateChecklistItemDto } from '@/checklists/checklist-items/dtos';

export class UpdateChecklistItemDto extends PartialType(
	CreateChecklistItemDto,
) {}
