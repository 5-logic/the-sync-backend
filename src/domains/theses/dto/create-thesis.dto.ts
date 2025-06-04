import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateThesisDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsString()
	englishName: string;

	@ApiProperty()
	@IsNotEmpty()
	@IsString()
	vietnameseName: string;

	@ApiProperty()
	@IsNotEmpty()
	@IsString()
	abbreviation: string;

	@ApiProperty()
	@IsNotEmpty()
	@IsString()
	context: string;

	@ApiProperty()
	@IsNotEmpty()
	@IsString()
	supportingDocument: string;

	@ApiProperty()
	@IsNotEmpty()
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
