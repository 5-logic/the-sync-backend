import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateMilestoneDto } from '@/milestones/dto/create-milestone.dto';

export class UpdateMilestoneDto extends PartialType(
	OmitType(CreateMilestoneDto, ['semesterId'] as const),
) {}
