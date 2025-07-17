import { ApiProperty } from '@nestjs/swagger';

import { SkillReponse } from '@/skill-sets/responses/skill.response';

export class SkillSetReponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty({ type: SkillReponse, isArray: true })
	skills: SkillReponse[];

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;
}
