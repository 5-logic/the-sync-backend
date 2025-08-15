import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SemesterResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	code: string;

	@ApiProperty()
	status: string;

	@ApiPropertyOptional()
	ongoingPhase?: string;

	@ApiProperty()
	defaultThesesPerLecturer: number;

	@ApiProperty()
	maxThesesPerLecturer: number;

	@ApiProperty()
	createdAt: string;

	@ApiProperty()
	updatedAt: string;
}
