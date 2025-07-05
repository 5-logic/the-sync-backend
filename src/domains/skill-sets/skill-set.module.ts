import { Module } from '@nestjs/common';

import { SkillSetController } from '@/domains/skill-sets/skill-set.controller';
import { SkillSetService } from '@/domains/skill-sets/skill-set.service';

@Module({
	controllers: [SkillSetController],
	providers: [SkillSetService],
})
export class SkillSetModule {}
