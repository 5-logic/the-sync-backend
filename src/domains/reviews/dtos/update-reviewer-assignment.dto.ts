import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UpdateReviewerAssignmentDto {
	@ApiProperty()
	@IsUUID()
	currentReviewerId: string;

	@ApiProperty()
	@IsUUID()
	newReviewerId: string;
}
