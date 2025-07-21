import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class ToggleLecturerStatusDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@ApiPropertyOptional()
	@IsOptional()
	@IsBoolean()
	isModerator?: boolean;
}
