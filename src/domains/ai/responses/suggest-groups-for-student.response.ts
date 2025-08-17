import { ApiProperty } from '@nestjs/swagger';

export class GroupLeader {
	@ApiProperty({
		description: 'Leader full name',
		example: 'Nguyen Van A',
	})
	fullName: string;

	@ApiProperty({
		description: 'Leader student code',
		example: 'SE161234',
	})
	studentCode: string;

	@ApiProperty({
		description: 'Leader email',
		example: 'se161234@fpt.edu.vn',
	})
	email: string;
}

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
		description: 'Group leader information',
		type: GroupLeader,
	})
	leader: GroupLeader;

	@ApiProperty({
		description: 'Number of current group members',
		example: 3,
		minimum: 1,
		maximum: 5,
	})
	memberCount: number;

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
