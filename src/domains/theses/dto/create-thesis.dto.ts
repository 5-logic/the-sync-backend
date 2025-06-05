import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateThesisDto {
	@ApiProperty()
	@IsString()
	englishName: string;

	@ApiProperty()
	@IsString()
	vietnameseName: string;

	@ApiProperty()
	@IsString()
	abbreviation: string;

	@ApiProperty()
	@IsString()
	context: string;

	@ApiProperty()
	@IsString()
	supportingDocument: string;

	@ApiProperty()
	@IsIn(['New', 'Pending', 'Rejected', 'Approved'])
	status: ThesisStatus;

	@ApiProperty()
	@IsOptional()
	@IsString()
	expectedOutcome?: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	requiredSkills?: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	suggestedTechnologies?: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	domain?: string;
}

export type ThesisStatus = 'New' | 'Pending' | 'Rejected' | 'Approved';
