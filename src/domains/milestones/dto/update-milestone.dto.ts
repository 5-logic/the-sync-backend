import { PartialType } from '@nestjs/swagger';

import { CreateMilestoneDto } from '@/milestones/dto/create-milestone.dto';

export class UpdateMilestoneDto extends PartialType(CreateMilestoneDto) {}
