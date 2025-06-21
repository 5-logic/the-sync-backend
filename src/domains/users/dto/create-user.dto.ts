import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsBoolean,
	IsEmail,
	IsEnum,
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

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	@MinLength(12)
	@Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/)
	password?: string;

	@ApiProperty({ enum: Gender, default: Gender.Male })
	@IsEnum(Gender)
	gender: Gender;

	@ApiProperty()
	@IsString()
	phoneNumber: string;
}
