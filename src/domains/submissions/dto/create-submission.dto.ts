import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateSubmissionDto {
	@ApiPropertyOptional()
	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	documents?: string[];
}
