import { ApiProperty } from '@nestjs/swagger';

export class DuplicateThesisResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	englishName: string;

	@ApiProperty()
	vietnameseName: string;

	@ApiProperty()
	description: string;

	@ApiProperty()
	duplicatePercentage: number;
}
