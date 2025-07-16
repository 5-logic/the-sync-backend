import { PartialType } from '@nestjs/swagger';

import { CreateGroupDto } from '@/groups/dto';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {}
