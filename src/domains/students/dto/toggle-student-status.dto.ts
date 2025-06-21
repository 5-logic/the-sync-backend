import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class ToggleStudentStatusDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}
