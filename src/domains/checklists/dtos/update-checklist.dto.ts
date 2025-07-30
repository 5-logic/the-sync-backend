import { PartialType } from '@nestjs/swagger';

import { CreateChecklistDto } from '@/checklists/dtos';

export class UpdateChecklistDto extends PartialType(CreateChecklistDto) {}
