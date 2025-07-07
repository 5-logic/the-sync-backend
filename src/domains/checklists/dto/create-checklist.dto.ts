import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateChecklistDto {
	@ApiProperty({
		description: 'Name of the checklist',
		example: 'Project Proposal Checklist',
	})
	@IsNotEmpty()
	@IsString()
	name: string;

	@ApiPropertyOptional({
		description: 'Description of the checklist',
		example: 'Checklist for evaluating project proposals',
	})
	@IsOptional()
	@IsString()
	description?: string;

	@ApiPropertyOptional({
		description: 'ID of the milestone this checklist belongs to',
		example: 'milestone-uuid',
	})
	@IsOptional()
	@IsUUID()
	milestoneId?: string;
}
