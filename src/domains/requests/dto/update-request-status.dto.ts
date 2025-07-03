import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { RequestStatus } from '~/generated/prisma';

export class UpdateRequestStatusDto {
	@ApiProperty()
	@IsEnum(RequestStatus)
	status: RequestStatus;
}
