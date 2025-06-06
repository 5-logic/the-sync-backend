import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

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
	password: string;
}
