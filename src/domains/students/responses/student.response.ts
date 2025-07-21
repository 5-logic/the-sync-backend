import { ApiProperty } from '@nestjs/swagger';

export class StudentResponse {
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
	studentCode: string;

	@ApiProperty()
	majorId: string;

	@ApiProperty()
	createdAt: string;

	@ApiProperty()
	updatedAt: string;
}
