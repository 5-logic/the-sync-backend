import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateLecturerDto } from '@/lecturers/dto/create-lecturer.dto';

export class UpdateLecturerDto extends PartialType(
	OmitType(CreateLecturerDto, ['email', 'password', 'isModerator'] as const),
) {}
