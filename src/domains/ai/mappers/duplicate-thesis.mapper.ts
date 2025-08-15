import { DuplicateThesisResponse } from '@/ai/responses';

import { Thesis } from '~/generated/prisma';

export const mapDuplicateThesis = (
	thesis: Thesis,
	duplicatePercentage: number,
	reasons: string[] = [],
): DuplicateThesisResponse => {
	return {
		id: thesis.id,
		englishName: thesis.englishName,
		vietnameseName: thesis.vietnameseName,
		description: thesis.description,
		reasons: reasons,
		duplicatePercentage: duplicatePercentage,
	};
};
