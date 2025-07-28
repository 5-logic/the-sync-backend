import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import { GROUP_API_TAGS, GROUP_CONSTANTS } from '@/groups/constants';
import { GroupLecturerDocs } from '@/groups/docs';
import { GroupLecturerService } from '@/groups/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(GROUP_API_TAGS)
@Controller(GROUP_CONSTANTS.BASE)
export class GroupLecturerController {
	constructor(private readonly service: GroupLecturerService) {}

	@Roles(Role.MODERATOR, Role.LECTURER)
	@HttpCode(HttpStatus.OK)
	@Get('supervise/semester/:semesterId')
	@ApiOperation(GroupLecturerDocs.findSupervisedGroups)
	async findSupervisedGroups(
		@Req() req: Request,
		@Param('semesterId') semesterId: string,
	) {
		const user = req.user as UserPayload;

		return await this.service.findSupervisedGroups(user.id, semesterId);
	}
}
