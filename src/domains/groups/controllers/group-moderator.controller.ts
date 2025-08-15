import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Param,
	Put,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import { GROUP_API_TAGS, GROUP_CONSTANTS } from '@/groups/constants';
import { GroupModeratorDocs } from '@/groups/docs';
import { AssignStudentDto } from '@/groups/dtos';
import { GroupModeratorService } from '@/groups/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(GROUP_API_TAGS)
@Controller(GROUP_CONSTANTS.BASE)
export class GroupModeratorController {
	constructor(private readonly service: GroupModeratorService) {}

	@Roles(Role.ADMIN, Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Put(':id/assign-student')
	@ApiOperation(GroupModeratorDocs.assignStudent)
	async assignStudent(
		@Req() req: Request,
		@Param('id') id: string,
		@Body() dto: AssignStudentDto,
	) {
		const user = req.user as UserPayload;

		return await this.service.assignStudent(id, dto.studentId, user.id);
	}
}
