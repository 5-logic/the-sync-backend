import { SkillReponse } from '@/skill-sets/responses';

import { Skill } from '~/generated/prisma';

export const mapSkill = (skill: Skill): SkillReponse => {
	return {
		id: skill.id,
		name: skill.name,
		skillSetId: skill.skillSetId,
		createdAt: skill.createdAt.toISOString(),
		updatedAt: skill.updatedAt.toISOString(),
	};
};
