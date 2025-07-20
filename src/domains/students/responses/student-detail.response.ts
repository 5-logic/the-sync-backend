import { ApiProperty } from '@nestjs/swagger';

import { StudentResponse } from '@/students/responses/student.response';

class Major {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	code: string;
}

class Semester {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	code: string;

	@ApiProperty()
	status: string;
}

class SkillSet {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;
}

class Enrollment {
	@ApiProperty({ type: Semester })
	semester: Semester;

	@ApiProperty()
	status: string;
}

class StudentSkill {
	@ApiProperty()
	skillId: string;

	@ApiProperty()
	skillName: string;

	@ApiProperty()
	level: string;

	@ApiProperty({ type: SkillSet })
	skillSet: SkillSet;
}

class StudentExpectedResponsibility {
	@ApiProperty()
	responsibilityId: string;

	@ApiProperty()
	responsibilityName: string;
}

export class StudentDetailResponse extends StudentResponse {
	@ApiProperty({ type: Major })
	major: Major;

	@ApiProperty({ type: Enrollment, isArray: true })
	enrollments: Enrollment[];

	@ApiProperty({ type: StudentSkill, isArray: true })
	studentSkills: StudentSkill[];

	@ApiProperty({ type: StudentExpectedResponsibility, isArray: true })
	studentExpectedResponsibilities: StudentExpectedResponsibility[];
}
