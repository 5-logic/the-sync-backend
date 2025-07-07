import { PartialType } from '@nestjs/swagger';

import { CreateChecklistDto } from '@/checklists/dto';

export class UpdateChecklistDto extends PartialType(CreateChecklistDto) {}
