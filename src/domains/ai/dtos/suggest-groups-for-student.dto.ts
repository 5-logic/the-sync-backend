import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SuggestGroupsForStudentDto {
	@ApiProperty({
		description: 'UUID of the student to suggest groups for',
		example: '123e4567-e89b-12d3-a456-426614174000',
	})
	@IsUUID(4)
	studentId: string;

	@ApiProperty({
		description: 'UUID of the semester to find groups in',
		example: '987fcdeb-51a2-43d1-9876-ba9876543210',
	})
	@IsUUID(4)
	semesterId: string;
}
