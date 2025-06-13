import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsEmail,
	IsOptional,
	IsString,
	Matches,
	MinLength,
} from 'class-validator';

export class CreateAdminDto {
	@ApiProperty()
	@IsString()
	username: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsEmail()
	email?: string;

	@ApiProperty()
	@IsString()
	@MinLength(12)
	@Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/)
	password: string;
}
