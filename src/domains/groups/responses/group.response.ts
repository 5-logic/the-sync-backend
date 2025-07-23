import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Semester {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	code: string;

	@ApiProperty()
	status: string;
}

class Thesis {
	@ApiProperty()
	id: string;

	@ApiProperty()
	englishName: string;

	@ApiProperty()
	vietnameseName: string;
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

	@ApiPropertyOptional()
	thesis?: Thesis;

	@ApiProperty()
	memberCount: number;

	@ApiProperty()
	leader: Leader;

	@ApiProperty()
	createdAt: string;

	@ApiProperty()
	updatedAt: string;
}
