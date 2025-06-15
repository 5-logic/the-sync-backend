import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

import { CreateUserDto } from '@/users/dto/create-user.dto';

export class CreateLecturerDto extends CreateUserDto {
	@ApiPropertyOptional({ default: false })
	@IsOptional()
	@IsBoolean()
	isModerator?: boolean;
}
