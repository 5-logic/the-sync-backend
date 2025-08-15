import { ApiProperty } from '@nestjs/swagger';

import { StudentDetailResponse } from '@/students/responses';

export class SuggestStudentsForGroupResponse {
	@ApiProperty({
		description: 'Reasons why these students are recommended for the group',
		example:
			'The group needs members with strong Backend and AI skills to balance the current Frontend-heavy composition.',
	})
	reasons: string;

	@ApiProperty({
		type: [StudentDetailResponse],
		description: 'List of recommended students sorted by compatibility score',
	})
	students: StudentDetailResponse[];
}
