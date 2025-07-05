import { Module } from '@nestjs/common';

import { SkillSetController } from '~/src/domains/skill-sets/skill-set.controller';
import { SkillSetService } from '~/src/domains/skill-sets/skill-set.service';

@Module({
	controllers: [SkillSetController],
	providers: [SkillSetService],
})
export class SkillSetModule {}
