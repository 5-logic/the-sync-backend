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

class Enrollment {
	@ApiProperty({ type: Semester })
	semester: Semester;

	@ApiProperty()
	status: string;
}

class StudentResponsibility {
	@ApiProperty()
	responsibilityId: string;

	@ApiProperty()
	responsibilityName: string;

	@ApiProperty()
	level: string;
}

export class StudentDetailResponse extends StudentResponse {
	@ApiProperty({ type: Major })
	major: Major;

	@ApiProperty({ type: Enrollment, isArray: true })
	enrollments: Enrollment[];

	@ApiProperty({ type: StudentResponsibility, isArray: true })
	studentResponsibilities: StudentResponsibility[];
}
