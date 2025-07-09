import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSubmissionDto {
	@ApiProperty({
		description: 'ID of the group making the submission',
		example: 'group-uuid-123',
	})
	@IsString()
	@IsNotEmpty()
	groupId: string;

	@ApiProperty({
		description: 'ID of the milestone for the submission',
		example: 'milestone-uuid-456',
	})
	@IsString()
	@IsNotEmpty()
	milestoneId: string;
}
