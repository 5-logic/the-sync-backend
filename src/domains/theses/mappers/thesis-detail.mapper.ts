import { mapThesis } from '@/theses/mappers/thesis.mapper';
import { ThesisDetailResponse } from '@/theses/responses';

import { Lecturer, Thesis, ThesisVersion, User } from '~/generated/prisma';

type ThesisDetailData = Thesis & {
	thesisVersions: ThesisVersion[];
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
	lecturer: {
		id: data.lecturer.userId,
		fullName: data.lecturer.user.fullName,
		email: data.lecturer.user.email,
	},
});
