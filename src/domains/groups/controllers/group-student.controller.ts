import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import {
	JwtAccessAuthGuard,
	Role,
	RoleGuard,
	Roles,
	UserPayload,
} from '@/auth';
import {
	ChangeLeaderDto,
	CreateGroupDto,
	PickThesisDto,
	RemoveStudentDto,
	UpdateGroupDto,
} from '@/groups//dtos';
import { GROUP_API_TAGS, GROUP_CONSTANTS } from '@/groups/constants';
import { GroupStudentService } from '@/groups/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(GROUP_API_TAGS)
@Controller(GROUP_CONSTANTS.BASE)
export class GroupStudentController {
	constructor(private readonly service: GroupStudentService) {}

	@Roles(Role.STUDENT)
	@Post()
	async create(@Req() req: Request, @Body() dto: CreateGroupDto) {
		const user = req.user as UserPayload;

		return await this.service.create(user.id, dto);
	}

	@Roles(Role.STUDENT)
	@Put(':id')
	async update(
		@Req() req: Request,
		@Param('id') id: string,
		@Body() dto: UpdateGroupDto,
	) {
		const user = req.user as UserPayload;

		return await this.service.update(id, user.id, dto);
	}

	@Roles(Role.STUDENT)
	@Put(':id/change-leader')
	async changeLeader(
		@Req() req: Request,
		@Param('id') id: string,
		@Body() dto: ChangeLeaderDto,
	) {
		const user = req.user as UserPayload;

		return await this.service.changeLeader(id, user.id, dto);
	}

	@Roles(Role.STUDENT)
	@Put(':id/remove-student')
	async removeStudent(
		@Req() req: Request,
		@Param('id') id: string,
		@Body() dto: RemoveStudentDto,
	) {
		const user = req.user as UserPayload;

		return await this.service.removeStudent(id, user.id, dto);
	}

	@Roles(Role.STUDENT)
	@Put(':id/leave')
	async leaveGroup(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.service.leaveGroup(id, user.id);
	}

	@Roles(Role.STUDENT)
	@Put(':id/pick-thesis')
	async pickThesis(
		@Req() req: Request,
		@Param('id') id: string,
		@Body() dto: PickThesisDto,
	) {
		const user = req.user as UserPayload;

		return await this.service.pickThesis(id, user.id, dto);
	}

	@Roles(Role.STUDENT)
	@Put(':id/unpick-thesis')
	async unpickThesis(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.service.unpickThesis(id, user.id);
	}

	@Roles(Role.STUDENT)
	@Delete(':id')
	async delete(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.service.delete(id, user.id);
	}

	@Get('student')
	async findMyGroups(@Req() req: Request) {
		const user = req.user as UserPayload;

		return await this.service.findDetailedByStudentId(user.id);
	}
}
