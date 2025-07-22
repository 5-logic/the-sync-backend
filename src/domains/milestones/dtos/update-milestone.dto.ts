import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateMilestoneDto } from '@/milestones/dtos';

export class UpdateMilestoneDto extends PartialType(
	OmitType(CreateMilestoneDto, ['semesterId'] as const),
) {}
