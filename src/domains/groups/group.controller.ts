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
		description:
			'Create a new group with required skills and expected responsibilities. Students can only create groups during the PREPARING semester status. Each student can only be a member of one group per semester. The system enforces maximum group limits per semester and automatically generates group codes in the format {SemesterCode}QN{SequenceNumber}. The creator automatically becomes the group leader. Validates that all specified skills and responsibilities exist before group creation.',
	})
	async create(@Req() req: Request, @Body() dto: CreateGroupDto) {
		const user = req.user as UserPayload;

		return await this.groupService.create(user.id, dto);
	}

	@Get()
	@ApiOperation({
		summary: 'Get all groups',
		description:
			'Retrieve all groups across all semesters with basic information including group code, name, creation date, and current member count. Results are cached for performance optimization. No authentication required for this public endpoint.',
	})
	async findAll() {
		return await this.groupService.findAll();
	}

	@Get('student')
	@ApiOperation({
		summary: 'Get my groups',
		description:
			'Get detailed information about all groups where the authenticated user is currently a member. Returns comprehensive group details including skills, responsibilities, and member information. Automatically filters by the current user session to ensure data privacy.',
	})
	async findMyGroups(@Req() req: Request) {
		const user = req.user as UserPayload;

		return await this.groupService.findDetailedByStudentId(user.id);
	}

	@Get('student/:studentId')
	@ApiOperation({
		summary: 'Get groups by student ID',
		description:
			'Get detailed information about all groups where a specific student is a member. Returns the same comprehensive group data as the personal endpoint but for any student ID. Useful for administrators, lecturers, or other students to view group memberships across different semesters.',
	})
	async findByStudentId(@Param('studentId') studentId: string) {
		return await this.groupService.findDetailedByStudentId(studentId);
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Get group by ID',
		description:
			'Get comprehensive group information including basic details, all members with their roles, required skills, expected responsibilities, and semester information. Results are cached for performance. Returns detailed member profiles and leadership status for complete group overview.',
	})
	async findOne(@Param('id') id: string) {
		return await this.groupService.findOne(id);
	}

	@Roles(Role.STUDENT)
	@Put(':id')
	@ApiOperation({
		summary: 'Update group',
		description:
			'Update group information including name, project direction, required skills, and expected responsibilities. Only the group leader can perform updates. Only allowed during PREPARING semester status. Validates that all specified skills and responsibilities exist. Updates trigger cache invalidation for related group data.',
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
		description:
			'Transfer group leadership to another existing member of the group. Only the current group leader can initiate this change. The new leader must already be a member of the group. Only allowed during PREPARING semester status. Sends email notifications to both old and new leaders about the leadership change. Updates all related participation records.',
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
		description:
			'Assign a student to an existing group. Restricted to MODERATOR role only for administrative purposes. Validates that the student is not already a member of any group in the same semester. Checks group capacity limits and semester enrollment status. Sends email notification to the assigned student about their group membership.',
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
		description:
			'Remove a member from the group. Only the group leader can remove other members. The leader cannot remove themselves - leadership must be transferred first. Only allowed during PREPARING semester status. Automatically handles cleanup of participation records and sends email notification to the removed student.',
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
		description:
			'Get detailed information about all members of a specific group including their personal information, student codes, enrollment status, and leadership roles within the group. Returns comprehensive member profiles with user details and participation status. Results are cached for performance optimization.',
	})
	async findGroupMembers(@Param('id') id: string) {
		return await this.groupService.findGroupMembers(id);
	}

	@Get(':id/skills-responsibilities')
	@ApiOperation({
		summary: 'Get group skills and responsibilities',
		description:
			"Get comprehensive information about the required skills and expected responsibilities associated with a specific group. Returns detailed skill descriptions, categories, and responsibility definitions that define the group's technical and functional requirements. Useful for understanding group capabilities and project scope.",
	})
	async findGroupSkillsAndResponsibilities(@Param('id') id: string) {
		return await this.groupService.findGroupSkillsAndResponsibilities(id);
	}

	@Roles(Role.STUDENT)
	@Delete(':id')
	@ApiOperation({
		summary: 'Delete group',
		description:
			'Delete a group permanently. Only the group leader can delete the group. Groups can only be deleted during the PREPARING semester status. Cannot delete groups that have assigned thesis, submitted work, or any milestone submissions. All pending requests will be automatically rejected. All group members will be notified via email about the group deletion. This action cannot be undone.',
	})
	async delete(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.groupService.delete(id, user.id);
	}
}
