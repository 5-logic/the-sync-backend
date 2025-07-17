import { Module } from '@nestjs/common';

import { SkillSetController } from '@/skill-sets/controllers';
import { SkillSetService } from '@/skill-sets/services';

@Module({
	controllers: [SkillSetController],
	providers: [SkillSetService],
})
export class SkillSetModule {}
