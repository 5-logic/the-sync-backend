import { ApiProperty } from '@nestjs/swagger';

export class MilestoneResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	startDate: string;

	@ApiProperty()
	endDate: string;

	@ApiProperty()
	semesterId: string;

	@ApiProperty()
	note: string;

	@ApiProperty()
	documents: string[];

	@ApiProperty()
	createdAt: string;

	@ApiProperty()
	updatedAt: string;
}
