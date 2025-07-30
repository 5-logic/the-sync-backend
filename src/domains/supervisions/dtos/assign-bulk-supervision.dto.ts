import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsUUID, ValidateNested } from 'class-validator';

export class SingleThesisAssignmentDto {
	@ApiProperty()
	@IsUUID('4')
	thesisId: string;

	@ApiPropertyOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	@ArrayMaxSize(2)
	lecturerIds?: string[];
}

export class AssignBulkSupervisionDto {
	@ApiProperty({
		example: [
			{
				thesisId: '123e4567-e89b-12d3-a456-426614174000',
				lecturerIds: [
					'123e4567-e89b-12d3-a456-426614174001',
					'123e4567-e89b-12d3-a456-426614174002',
				],
			},
			{
				thesisId: '123e4567-e89b-12d3-a456-426614174003',
				lecturerIds: ['123e4567-e89b-12d3-a456-426614174004'],
			},
		],
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SingleThesisAssignmentDto)
	assignments: SingleThesisAssignmentDto[];
}
