import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateUserDto } from '@/domains/users/dto/create-user.dto';

export class UpdateUserDto extends PartialType(
	OmitType(CreateUserDto, ['email'] as const),
) {}
