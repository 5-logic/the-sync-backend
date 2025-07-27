import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';

import { GroupResponse, Thesis } from '@/groups/responses/group.response';

class Major {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	code: string;
}

class SkillSet {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;
}

class GroupRequiredSkill {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	skillSet: SkillSet;
}

class GroupExpectedResponsibility {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;
}

class StudentGroupParticipation {
	@ApiProperty()
	id: string;

	@ApiProperty()
	fullName: string;

	@ApiProperty()
	email: string;

	@ApiProperty()
	studentCode: string;

	@ApiProperty()
	major: Major;

	@ApiProperty()
	isLeader: boolean;
}

export class GroupDetailResponse extends OmitType(GroupResponse, [
	'thesis',
	'memberCount',
	'leader',
] as const) {
	@ApiPropertyOptional()
	thesis?: Thesis;

	@ApiProperty()
	groupRequiredSkills: GroupRequiredSkill[];

	@ApiProperty()
	groupExpectedResponsibilities: GroupExpectedResponsibility[];

	@ApiProperty()
	studentGroupParticipations: StudentGroupParticipation[];
}
