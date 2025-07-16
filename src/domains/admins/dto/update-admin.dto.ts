import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, Matches, MinLength } from 'class-validator';

export class UpdateAdminDto {
	@ApiPropertyOptional()
	@IsEmail()
	@IsOptional()
	email?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@MinLength(12)
	@Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/)
	oldPassword?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@MinLength(12)
	@Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/)
	newPassword?: string;
}
