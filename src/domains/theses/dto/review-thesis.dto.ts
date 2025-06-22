import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { ThesisStatus } from '~/generated/prisma';

export class ReviewThesisDto {
	@ApiProperty({ enum: ThesisStatus, default: ThesisStatus.Approved })
	@IsEnum(ThesisStatus)
	status: ThesisStatus;
}
