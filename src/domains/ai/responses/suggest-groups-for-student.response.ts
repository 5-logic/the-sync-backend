import { ApiProperty } from '@nestjs/swagger';

export class GroupWithCompatibility {
	@ApiProperty({
		description: 'Group ID',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	id: string;

	@ApiProperty({
		description: 'Group code',
		example: 'SU25SEAI001',
	})
	code: string;

	@ApiProperty({
		description: 'Group name',
		example: 'Group 001',
	})
	name: string;

	@ApiProperty({
		description: 'Compatibility score from 0.0 to 1.0',
		example: 0.85,
		minimum: 0,
		maximum: 1,
	})
	compatibility: number;
}

export class SuggestGroupsForStudentResponse {
	@ApiProperty({
		description: 'Reasons why these groups are recommended for the student',
		example:
			'You have strong skills in Backend and AI, so I recommend groups that need Backend and AI expertise.',
	})
	reason: string;

	@ApiProperty({
		type: [GroupWithCompatibility],
		description:
			'List of recommended groups with compatibility scores, sorted by compatibility',
	})
	groups: GroupWithCompatibility[];
}
