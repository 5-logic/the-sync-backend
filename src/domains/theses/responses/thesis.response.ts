import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ThesisResponse {
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

	@ApiPropertyOptional()
	domain?: string;

	@ApiProperty()
	orientation: string;

	@ApiProperty()
	status: string;

	@ApiProperty()
	isPublish: boolean;

	@ApiPropertyOptional()
	groupId?: string;

	@ApiProperty()
	lecturerId: string;

	@ApiProperty()
	semesterId: string;

	@ApiProperty()
	createdAt: string;

	@ApiProperty()
	updatedAt: string;
}
