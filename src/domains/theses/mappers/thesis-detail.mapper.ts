import { mapThesis } from '@/theses/mappers/thesis.mapper';
import { ThesisDetailResponse } from '@/theses/responses';

import {
	Lecturer,
	Skill,
	Thesis,
	ThesisRequiredSkill,
	ThesisVersion,
	User,
} from '~/generated/prisma';

type ThesisDetailData = Thesis & {
	thesisVersions: ThesisVersion[];
	thesisRequiredSkills: (ThesisRequiredSkill & { skill: Skill })[];
	lecturer: Lecturer & { user: User };
};

export const mapThesisDetail = (
	data: ThesisDetailData,
): ThesisDetailResponse => ({
	...mapThesis(data),
	thesisVersions: data.thesisVersions.map((ts) => ({
		id: ts.id,
		version: ts.version,
		supportingDocument: ts.supportingDocument,
	})),
	thesisRequiredSkills: data.thesisRequiredSkills.map((trs) => ({
		id: trs.skillId,
		name: trs.skill.name,
	})),
	lecturer: {
		id: data.lecturer.userId,
		fullName: data.lecturer.user.fullName,
		email: data.lecturer.user.email,
	},
});
