import { PartialType } from '@nestjs/swagger';

import { CreateUserDto } from '@/users/index';

export class UpdateLecturerDto extends PartialType(CreateUserDto) {}
