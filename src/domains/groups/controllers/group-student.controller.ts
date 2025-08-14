import {
	Body,
	Controller,
	// Delete,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Put,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import { GROUP_API_TAGS, GROUP_CONSTANTS } from '@/groups/constants';
import { GroupStudentDocs } from '@/groups/docs';
import {
	ChangeLeaderDto,
	CreateGroupDto,
	PickThesisDto,
	RemoveStudentDto,
	UpdateGroupDto,
} from '@/groups/dtos';
import { GroupStudentService } from '@/groups/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(GROUP_API_TAGS)
@Controller(GROUP_CONSTANTS.BASE)
export class GroupStudentController {
	constructor(private readonly service: GroupStudentService) {}

	@Roles(Role.STUDENT)
	@HttpCode(HttpStatus.CREATED)
	@Post()
	@ApiOperation(GroupStudentDocs.create)
	async create(@Req() req: Request, @Body() dto: CreateGroupDto) {
		const user = req.user as UserPayload;

		return await this.service.create(user.id, dto);
	}

	@Roles(Role.STUDENT)
	@HttpCode(HttpStatus.OK)
	@Put(':id')
	@ApiOperation(GroupStudentDocs.update)
	async update(
		@Req() req: Request,
		@Param('id') id: string,
		@Body() dto: UpdateGroupDto,
	) {
		const user = req.user as UserPayload;

		return await this.service.update(id, user.id, dto);
	}

	@Roles(Role.STUDENT)
	@HttpCode(HttpStatus.OK)
	@Put(':id/change-leader')
	@ApiOperation(GroupStudentDocs.changeLeader)
	async changeLeader(
		@Req() req: Request,
		@Param('id') id: string,
		@Body() dto: ChangeLeaderDto,
	) {
		const user = req.user as UserPayload;

		return await this.service.changeLeader(id, user.id, dto);
	}

	@Roles(Role.STUDENT)
	@HttpCode(HttpStatus.OK)
	@Put(':id/remove-student')
	@ApiOperation(GroupStudentDocs.removeStudent)
	async removeStudent(
		@Req() req: Request,
		@Param('id') id: string,
		@Body() dto: RemoveStudentDto,
	) {
		const user = req.user as UserPayload;

		return await this.service.removeStudent(id, dto.studentId, user.id);
	}

	@Roles(Role.STUDENT)
	@HttpCode(HttpStatus.OK)
	@Put(':id/leave')
	@ApiOperation(GroupStudentDocs.leaveGroup)
	async leaveGroup(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.service.leaveGroup(id, user.id);
	}

	@Roles(Role.STUDENT)
	@HttpCode(HttpStatus.OK)
	@Put(':id/pick-thesis')
	@ApiOperation(GroupStudentDocs.pickThesis)
	async pickThesis(
		@Req() req: Request,
		@Param('id') id: string,
		@Body() dto: PickThesisDto,
	) {
		const user = req.user as UserPayload;

		return await this.service.pickThesis(id, user.id, dto);
	}

	@Roles(Role.MODERATOR, Role.STUDENT)
	@HttpCode(HttpStatus.OK)
	@Put(':id/unpick-thesis')
	@ApiOperation(GroupStudentDocs.unpickThesis)
	async unpickThesis(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.service.unpickThesis(id, user.id);
	}

	// @Roles(Role.MODERATOR, Role.STUDENT)
	// @HttpCode(HttpStatus.OK)
	// @Delete(':id')
	// @ApiOperation(GroupStudentDocs.delete)
	// async delete(@Req() req: Request, @Param('id') id: string) {
	// 	const user = req.user as UserPayload;

	// 	return await this.service.delete(id, user.id);
	// }
}
