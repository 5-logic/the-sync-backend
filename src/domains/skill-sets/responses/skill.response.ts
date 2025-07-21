import { ApiProperty } from '@nestjs/swagger';

export class SkillReponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	skillSetId: string;

	@ApiProperty()
	createdAt: string;

	@ApiProperty()
	updatedAt: string;
}
