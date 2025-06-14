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

import { Gender } from '~/generated/prisma';

export class CreateUserDto {
	@ApiProperty()
	@IsEmail()
	email: string;

	@ApiProperty()
	@IsString()
	fullName: string;

	@ApiProperty()
	@IsString()
	@MinLength(12)
	@Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/)
	password: string;

	@ApiProperty()
	@IsIn([Gender.Male, Gender.Female])
	gender: Gender;

	@ApiProperty()
	@IsString()
	phoneNumber: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsBoolean()
	isActive?: boolean = true;
}
