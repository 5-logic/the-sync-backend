import { PartialType } from '@nestjs/swagger';

import { CreateMajorDto } from '@/majors/dto/create-major.dto';

export class UpdateMajorDto extends PartialType(CreateMajorDto) {}
