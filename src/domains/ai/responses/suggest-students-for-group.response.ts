import { ApiProperty } from '@nestjs/swagger';

import { StudentDetailResponse } from '@/students/responses';

export class StudentWithCompatibility extends StudentDetailResponse {
	@ApiProperty({
		description: 'Compatibility score from 0.0 to 1.0',
		example: 0.85,
		minimum: 0,
		maximum: 1,
	})
	compatibility: number;
}

export class SuggestStudentsForGroupResponse {
	@ApiProperty({
		description: 'Reasons why these students are recommended for the group',
		example:
			'The group needs members with strong Backend and AI skills to balance the current Frontend-heavy composition.',
	})
	reason: string;

	@ApiProperty({
		type: [StudentWithCompatibility],
		description:
			'List of recommended students with compatibility scores, sorted by compatibility',
	})
	students: StudentWithCompatibility[];
}
