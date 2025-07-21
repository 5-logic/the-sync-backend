import { PartialType } from '@nestjs/swagger';

import { CreateGroupDto } from '@/groups/dtos/create-group.dto';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {}
