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

export class Thesis {
	@ApiProperty()
	id: string;

	@ApiProperty()
	englishName: string;

	@ApiProperty()
	vietnameseName: string;

	@ApiProperty()
	abbreviation: string;

	@ApiProperty()
	description: string;

	@ApiProperty()
	status: string;

	@ApiPropertyOptional()
	domain?: string;
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
	thesis?: Omit<Thesis, 'abbreviation' | 'description' | 'status' | 'domain'>;

	@ApiProperty()
	memberCount: number;

	@ApiProperty()
	leader: Leader;

	@ApiProperty()
	createdAt: string;

	@ApiProperty()
	updatedAt: string;
}
