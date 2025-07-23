import { ApiProperty } from '@nestjs/swagger';

export class StudentGroupParticipationResponse {
	@ApiProperty()
	studentId: string;

	@ApiProperty()
	groupId: string;

	@ApiProperty()
	semesterId: string;

	@ApiProperty()
	isLeader: boolean;
}
