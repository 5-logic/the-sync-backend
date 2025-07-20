import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';

import { SkillLevel } from '~/generated/prisma';

export class StudentSkillDto {
	@ApiProperty()
	@IsUUID()
	skillId: string;

	@ApiProperty({ enum: SkillLevel })
	@IsEnum(SkillLevel)
	level: SkillLevel;
}
