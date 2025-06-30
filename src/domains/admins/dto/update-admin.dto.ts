import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, Matches, MinLength } from 'class-validator';

export class UpdateAdminDto {
	@ApiProperty({ required: false })
	@IsEmail()
	@IsOptional()
	email?: string;

	@ApiProperty({ required: false })
	@MinLength(12)
	@Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/)
	oldPassword?: string;

	@ApiProperty({ required: false })
	@MinLength(12)
	@Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/)
	newPassword?: string;
}
