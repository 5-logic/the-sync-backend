import { ApiProperty } from '@nestjs/swagger';

import { ThesisResponse } from '@/theses/responses/thesis.response';

class ThesisVersion {
	@ApiProperty()
	id: string;

	@ApiProperty()
	version: number;

	@ApiProperty()
	supportingDocument: string;
}

class ThesisRequiredSkill {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;
}

class Lecturer {
	@ApiProperty()
	id: string;

	@ApiProperty()
	fullName: string;

	@ApiProperty()
	email: string;
}

export class ThesisDetailResponse extends ThesisResponse {
	@ApiProperty({ type: ThesisVersion, isArray: true })
	thesisVersions: ThesisVersion[];

	@ApiProperty({ type: ThesisRequiredSkill, isArray: true })
	thesisRequiredSkills: ThesisRequiredSkill[];

	@ApiProperty({ type: Lecturer })
	lecturer: Lecturer;
}
