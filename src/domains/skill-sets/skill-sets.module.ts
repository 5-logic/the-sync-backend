import { Module } from '@nestjs/common';

import { SkillSetsController } from '@/skill-sets/skill-sets.controller';
import { SkillSetsService } from '@/skill-sets/skill-sets.service';

@Module({
	controllers: [SkillSetsController],
	providers: [SkillSetsService],
})
export class SkillSetsModule {}
