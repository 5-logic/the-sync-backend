import { ApiProperty } from '@nestjs/swagger';

export class LecturerResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	fullName: string;

	@ApiProperty()
	email: string;

	@ApiProperty()
	gender: string;

	@ApiProperty()
	phoneNumber: string;

	@ApiProperty()
	isActive: boolean;

	@ApiProperty()
	isModerator: boolean;

	@ApiProperty()
	createdAt: string;

	@ApiProperty()
	updatedAt: string;
}
