import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	ArrayMaxSize,
	IsArray,
	IsBoolean,
	IsOptional,
	IsUUID,
	ValidateNested,
} from 'class-validator';

export class ReviewerAssignmentDto {
	@ApiProperty()
	@IsUUID('4')
	lecturerId: string;

	@ApiPropertyOptional({ default: false })
	@IsOptional()
	@IsBoolean()
	isMainReviewer?: boolean;
}

export class SingleSubmissionAssignmentDto {
	@ApiProperty()
	@IsUUID('4')
	submissionId: string;

	@ApiPropertyOptional({
		type: 'array',
		items: {
			type: 'object',
			properties: {
				lecturerId: { type: 'string', format: 'uuid' },
				isMainReviewer: { type: 'boolean', default: false },
			},
		},
		maxItems: 2,
		example: [
			{
				lecturerId: '123e4567-e89b-12d3-a456-426614174001',
				isMainReviewer: true,
			},
			{
				lecturerId: '123e4567-e89b-12d3-a456-426614174002',
				isMainReviewer: false,
			},
		],
	})
	@IsArray()
	@ArrayMaxSize(2)
	@ValidateNested({ each: true })
	@Type(() => ReviewerAssignmentDto)
	reviewerAssignments?: ReviewerAssignmentDto[];
}

export class AssignBulkLecturerReviewerDto {
	@ApiProperty({
		example: [
			{
				submissionId: '123e4567-e89b-12d3-a456-426614174000',
				reviewerAssignments: [
					{
						lecturerId: '123e4567-e89b-12d3-a456-426614174001',
						isMainReviewer: true,
					},
					{
						lecturerId: '123e4567-e89b-12d3-a456-426614174002',
						isMainReviewer: false,
					},
				],
			},
			{
				submissionId: '123e4567-e89b-12d3-a456-426614174003',
				reviewerAssignments: [
					{
						lecturerId: '123e4567-e89b-12d3-a456-426614174004',
						isMainReviewer: true,
					},
				],
			},
		],
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SingleSubmissionAssignmentDto)
	assignments: SingleSubmissionAssignmentDto[];
}
