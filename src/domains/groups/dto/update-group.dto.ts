import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateGroupDto } from '@/groups/dto/create-group.dto';

export class UpdateGroupDto extends PartialType(
	OmitType(CreateGroupDto, ['code', 'semesterId'] as const),
) {}
