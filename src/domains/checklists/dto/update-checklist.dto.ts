import { PartialType } from '@nestjs/swagger';

import { CreateChecklistDto } from '@/checklists/dto/create-checklist.dto';

export class UpdateChecklistDto extends PartialType(CreateChecklistDto) {}
