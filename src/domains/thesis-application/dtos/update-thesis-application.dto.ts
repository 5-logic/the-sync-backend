import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { ThesisApplicationStatus } from '~/generated/prisma';

export class UpdateThesisApplicationDto {
	@ApiProperty()
	@IsEnum(ThesisApplicationStatus)
	status: ThesisApplicationStatus;
}
