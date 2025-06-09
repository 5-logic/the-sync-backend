import { PartialType } from '@nestjs/swagger';

import { CreateSemesterDto } from '@/semesters/dto/create-semester.dto';

export class UpdateSemesterDto extends PartialType(CreateSemesterDto) {}
