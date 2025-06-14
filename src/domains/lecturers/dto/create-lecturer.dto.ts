import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';

import { CreateUserDto } from '@/users/dto/create-user.dto';

export class CreateLecturerDto {
	@ApiProperty({ type: () => CreateUserDto })
	@ValidateNested()
	@Type(() => CreateUserDto)
	createUserDto: CreateUserDto;

	@ApiPropertyOptional()
	@IsOptional()
	@IsBoolean()
	isModerator?: boolean = false;
}
