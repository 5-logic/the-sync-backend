import { mapSkill } from '@/skill-sets/mappers/skill.mapper';
import { SkillSetReponse } from '@/skill-sets/responses';

import { Skill, SkillSet } from '~/generated/prisma';

export const mapSkillSet = (
	skillSet: SkillSet & { skills: Skill[] },
): SkillSetReponse => {
	return {
		id: skillSet.id,
		name: skillSet.name,
		skills: skillSet.skills.map(mapSkill),
		createdAt: skillSet.createdAt.toISOString(),
		updatedAt: skillSet.updatedAt.toISOString(),
	};
};
