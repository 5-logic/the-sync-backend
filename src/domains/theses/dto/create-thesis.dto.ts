import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

import { ThesisStatus } from '~/generated/prisma';

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
	description: string;

	@ApiPropertyOptional()
	@IsOptional()
	domain?: string;

	@ApiPropertyOptional({ enum: ThesisStatus, default: ThesisStatus.New })
	@IsOptional()
	@IsEnum(ThesisStatus)
	status: ThesisStatus;

	@ApiPropertyOptional({ default: false })
	@IsOptional()
	@IsBoolean()
	isPublish: boolean;

	@ApiPropertyOptional()
	@IsOptional()
	groupId?: string;

	@ApiProperty()
	@IsString()
	lecturerId: string;

	@ApiPropertyOptional({ type: [String] })
	@IsOptional()
	thesisRequiredSkillIds?: string[];
}
