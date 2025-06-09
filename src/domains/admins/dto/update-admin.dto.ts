import { PartialType } from '@nestjs/swagger';

import { CreateAdminDto } from '@/admins/dto/create-admin.dto';

export class UpdateAdminDto extends PartialType(CreateAdminDto) {}
