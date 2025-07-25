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

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import { SwaggerDoc } from '@/common/docs/swagger-docs.decorator';
import { GroupService } from '@/groups/group.service';

import {
	AssignStudentDto,
	ChangeLeaderDto,
	CreateGroupDto,
	PickThesisDto,
	RemoveStudentDto,
	UpdateGroupDto,
} from '~/src/domains/groups/dtos';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Group')
@Controller('groups')
export class GroupController {
	constructor(private readonly groupService: GroupService) {}

	@Roles(Role.STUDENT)
	@Post()
	@SwaggerDoc('group', 'create')
	async create(@Req() req: Request, @Body() dto: CreateGroupDto) {
		const user = req.user as UserPayload;

		return await this.groupService.create(user.id, dto);
	}

	@Get()
	@SwaggerDoc('group', 'findAll')
	async findAll() {
		return await this.groupService.findAll();
	}

	@Get('student')
	@SwaggerDoc('group', 'findMyGroups')
	async findMyGroups(@Req() req: Request) {
		const user = req.user as UserPayload;

		return await this.groupService.findDetailedByStudentId(user.id);
	}

	@Get('student/:studentId')
	@SwaggerDoc('group', 'findByStudentId')
	async findByStudentId(@Param('studentId') studentId: string) {
		return await this.groupService.findDetailedByStudentId(studentId);
	}

	@Get(':id')
	@SwaggerDoc('group', 'findOne')
	async findOne(@Param('id') id: string) {
		return await this.groupService.findOne(id);
	}

	@Roles(Role.STUDENT)
	@Put(':id')
	@SwaggerDoc('group', 'update')
	async update(
		@Req() req: Request,
		@Param('id') id: string,
		@Body() dto: UpdateGroupDto,
	) {
		const user = req.user as UserPayload;

		return await this.groupService.update(id, user.id, dto);
	}

	@Roles(Role.STUDENT)
	@Put(':id/change-leader')
	@SwaggerDoc('group', 'changeLeader')
	async changeLeader(
		@Req() req: Request,
		@Param('id') id: string,
		@Body() dto: ChangeLeaderDto,
	) {
		const user = req.user as UserPayload;

		return await this.groupService.changeLeader(id, user.id, dto);
	}

	@Roles(Role.MODERATOR)
	@Put(':id/assign-student')
	@SwaggerDoc('group', 'assignStudent')
	async assignStudent(
		@Req() req: Request,
		@Param('id') id: string,
		@Body() dto: AssignStudentDto,
	) {
		const user = req.user as UserPayload;

		return await this.groupService.assignStudent(id, dto.studentId, user.id);
	}

	@Roles(Role.STUDENT)
	@Put(':id/remove-student')
	@SwaggerDoc('group', 'removeStudent')
	async removeStudent(
		@Req() req: Request,
		@Param('id') id: string,
		@Body() dto: RemoveStudentDto,
	) {
		const user = req.user as UserPayload;

		return await this.groupService.removeStudent(id, dto.studentId, user.id);
	}

	@Roles(Role.STUDENT)
	@Put(':id/leave')
	@SwaggerDoc('group', 'leaveGroup')
	async leaveGroup(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.groupService.leaveGroup(id, user.id);
	}

	@Get(':id/members')
	@SwaggerDoc('group', 'findGroupMembers')
	async findGroupMembers(@Param('id') id: string) {
		return await this.groupService.findGroupMembers(id);
	}

	@Get(':id/skills-responsibilities')
	@SwaggerDoc('group', 'findGroupSkillsAndResponsibilities')
	async findGroupSkillsAndResponsibilities(@Param('id') id: string) {
		return await this.groupService.findGroupSkillsAndResponsibilities(id);
	}

	@Roles(Role.STUDENT)
	@Put(':id/pick-thesis')
	@SwaggerDoc('group', 'pickThesis')
	async pickThesis(
		@Req() req: Request,
		@Param('id') id: string,
		@Body() dto: PickThesisDto,
	) {
		const user = req.user as UserPayload;

		return await this.groupService.pickThesis(id, user.id, dto);
	}

	@Roles(Role.STUDENT)
	@Put(':id/unpick-thesis')
	@SwaggerDoc('group', 'unpickThesis')
	async unpickThesis(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.groupService.unpickThesis(id, user.id);
	}

	@Roles(Role.MODERATOR, Role.STUDENT)
	@Delete(':id')
	@SwaggerDoc('group', 'delete')
	async delete(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.groupService.delete(id, user.id);
	}
}
