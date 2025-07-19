import { PartialType } from '@nestjs/swagger';

import { CreateGroupDto } from '~/src/domains/groups/dtos';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {}
