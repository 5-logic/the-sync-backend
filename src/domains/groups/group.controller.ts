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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import {
	AssignStudentDto,
	ChangeLeaderDto,
	CreateGroupDto,
	RemoveStudentDto,
	UpdateGroupDto,
} from '@/groups/dto';
import { GroupService } from '@/groups/group.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Group')
@Controller('groups')
export class GroupController {
	constructor(private readonly groupService: GroupService) {}

	@Roles(Role.STUDENT)
	@Post()
	@ApiOperation({
		summary: 'Create group',
		description: 'Create a new group with skills and responsibilities.',
	})
	async create(@Req() req: Request, @Body() dto: CreateGroupDto) {
		const user = req.user as UserPayload;

		return await this.groupService.create(user.id, dto);
	}

	@Get()
	@ApiOperation({
		summary: 'Get all groups',
		description: 'Retrieve all groups with basic information and member count.',
	})
	async findAll() {
		return await this.groupService.findAll();
	}

	@Get('student')
	@ApiOperation({
		summary: 'Get my groups',
		description: 'Get groups where current user is a member.',
	})
	async findMyGroups(@Req() req: Request) {
		const user = req.user as UserPayload;

		return await this.groupService.findDetailedByStudentId(user.id);
	}

	@Get('student/:studentId')
	@ApiOperation({
		summary: 'Get groups by student ID',
		description: 'Get groups where specific student is a member.',
	})
	async findByStudentId(@Param('studentId') studentId: string) {
		return await this.groupService.findDetailedByStudentId(studentId);
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Get group by ID',
		description: 'Get detailed group information including members and skills.',
	})
	async findOne(@Param('id') id: string) {
		return await this.groupService.findOne(id);
	}

	@Roles(Role.STUDENT)
	@Put(':id')
	@ApiOperation({
		summary: 'Update group',
		description: 'Update group information. Only group leader can update.',
	})
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
	@ApiOperation({
		summary: 'Change group leader',
		description: 'Transfer group leadership to another member.',
	})
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
	@ApiOperation({
		summary: 'Assign student to group',
		description: 'Assign a student to existing group. Moderator access only.',
	})
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
	@ApiOperation({
		summary: 'Remove student from group',
		description: 'Remove a member from group. Only group leader can remove.',
	})
	async removeStudent(
		@Req() req: Request,
		@Param('id') id: string,
		@Body() dto: RemoveStudentDto,
	) {
		const user = req.user as UserPayload;

		return await this.groupService.removeStudent(id, dto.studentId, user.id);
	}

	@Get(':id/members')
	@ApiOperation({
		summary: 'Get group members',
		description: 'Get all members of a specific group.',
	})
	async findGroupMembers(@Param('id') id: string) {
		return await this.groupService.findGroupMembers(id);
	}

	@Get(':id/skills-responsibilities')
	@ApiOperation({
		summary: 'Get group skills and responsibilities',
		description:
			'Get required skills and expected responsibilities of a group.',
	})
	async findGroupSkillsAndResponsibilities(@Param('id') id: string) {
		return await this.groupService.findGroupSkillsAndResponsibilities(id);
	}
}
