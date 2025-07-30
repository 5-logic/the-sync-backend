import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ChangeSupervisionDto {
	@ApiProperty()
	@IsUUID()
	currentSupervisorId: string;

	@ApiProperty()
	@IsUUID()
	newSupervisorId: string;
}
