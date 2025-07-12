import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsUUID, ValidateNested } from 'class-validator';

export class SingleSubmissionAssignmentDto {
	@ApiProperty()
	@IsUUID('4')
	submissionId: string;

	@ApiPropertyOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	@ArrayMaxSize(2)
	lecturerIds?: string[];
}

export class AssignBulkLecturerReviewerDto {
	@ApiProperty()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SingleSubmissionAssignmentDto)
	assignments: SingleSubmissionAssignmentDto[];
}
