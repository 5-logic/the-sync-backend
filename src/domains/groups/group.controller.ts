import {
	Body,
	Controller,
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
import { ChangeLeaderDto, CreateGroupDto, UpdateGroupDto } from '@/groups/dto';
import { GroupService } from '@/groups/group.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Group')
@Controller('groups')
export class GroupController {
	constructor(private readonly groupService: GroupService) {}

	@Roles(Role.STUDENT)
	@Post()
	async create(@Req() req: Request, @Body() dto: CreateGroupDto) {
		const user = req.user as UserPayload;

		return await this.groupService.create(user.id, dto);
	}

	@Get()
	async findAll() {
		return await this.groupService.findAll();
	}

	@Get('student')
	async findMyGroups(@Req() req: Request) {
		const user = req.user as UserPayload;

		return await this.groupService.findDetailedByStudentId(user.id);
	}

	@Get('student/:studentId')
	async findByStudentId(@Param('studentId') studentId: string) {
		return await this.groupService.findDetailedByStudentId(studentId);
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.groupService.findOne(id);
	}

	@Roles(Role.STUDENT)
	@Put(':id')
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
	async changeLeader(
		@Req() req: Request,
		@Param('id') id: string,
		@Body() dto: ChangeLeaderDto,
	) {
		const user = req.user as UserPayload;

		return await this.groupService.changeLeader(id, user.id, dto);
	}

	@Get(':id/members')
	async findGroupMembers(@Param('id') id: string) {
		return await this.groupService.findGroupMembers(id);
	}

	@Get(':id/skills-responsibilities')
	async findGroupSkillsAndResponsibilities(@Param('id') id: string) {
		return await this.groupService.findGroupSkillsAndResponsibilities(id);
	}
}
