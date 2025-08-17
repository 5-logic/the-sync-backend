import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Put,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import {
	JwtAccessAuthGuard,
	Role,
	RoleGuard,
	Roles,
	UserPayload,
} from '@/auth';
import { ApiBaseResponse } from '@/common';
import { STUDENT_API_TAGS, STUDENT_CONSTANTS } from '@/students/constants';
import { StudentSelfDocs } from '@/students/docs';
import { SelfUpdateStudentDto } from '@/students/dtos';
import { StudentDetailResponse } from '@/students/responses';
import { StudentSelfService } from '@/students/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(STUDENT_API_TAGS)
@Controller(STUDENT_CONSTANTS.BASE)
export class StudentSelfController {
	constructor(private readonly service: StudentSelfService) {}

	@Roles(Role.STUDENT)
	@HttpCode(HttpStatus.OK)
	@Put()
	@ApiOperation(StudentSelfDocs.update)
	@ApiBaseResponse(StudentDetailResponse, HttpStatus.OK)
	async update(
		@Req() req: Request,
		@Body() dto: SelfUpdateStudentDto,
	): Promise<StudentDetailResponse> {
		const user = req.user as UserPayload;

		return await this.service.update(user.id, dto);
	}
}
