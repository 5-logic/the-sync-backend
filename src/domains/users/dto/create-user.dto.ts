import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsBoolean,
	IsEmail,
	IsIn,
	IsOptional,
	IsString,
	Matches,
	MinLength,
} from 'class-validator';

export class CreateUserDto {
	@ApiProperty()
	@IsEmail()
	email: string;

	@ApiProperty()
	@IsString()
	fullName: string;

	@ApiProperty()
	@IsString()
	@MinLength(12, { message: 'Password must be at least 12 characters' })
	@Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/, {
		message:
			'Password must contain at least one uppercase letter, one number, and one special character',
	})
	password: string;

	@ApiProperty()
	@IsIn(['Male', 'Female'])
	gender: Gender;

	@ApiProperty()
	@IsString()
	phoneNumber: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsBoolean()
	isActive?: boolean = true;
}

export type Gender = 'Male' | 'Female';
