import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class UpdateReviewerAssignmentDto {
	@ApiProperty()
	@IsArray()
	@IsUUID('4', { each: true })
	lecturerIds: string[];
}
