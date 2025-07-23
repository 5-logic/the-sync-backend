import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

export class Leader {
	@ApiProperty()
	id: string;

	@ApiProperty()
	fullName: string;

	@ApiProperty()
	studentCode: string;
}

export class GroupResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	code: string;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	projectDirection?: string;

	@ApiProperty()
	semesterId: string;

	@ApiPropertyOptional()
	thesisId?: string;

	@ApiProperty()
	semester: Semester;

	@ApiProperty()
	memberCount: number;

	@ApiProperty()
	createdAt: string;

	@ApiProperty()
	updatedAt: string;
}
