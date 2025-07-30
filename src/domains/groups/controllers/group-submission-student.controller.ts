import {
	Body,
	Controller,
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
import {
	GROUP_SUBMISSION_API_TAGS,
	GROUP_SUBMISSION_CONSTANTS,
} from '@/groups/constants';
import { GroupSubmissionStudentDocs } from '@/groups/docs';
import { GroupSubmissionStudentService } from '@/groups/services';
import { CreateSubmissionDto, UpdateSubmissionDto } from '@/submissions/dtos';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(GROUP_SUBMISSION_API_TAGS)
@Controller(GROUP_SUBMISSION_CONSTANTS.BASE)
export class GroupSubmissionStudentController {
	constructor(private readonly service: GroupSubmissionStudentService) {}

	@Roles(Role.STUDENT)
	@HttpCode(HttpStatus.CREATED)
	@Post(':groupId/milestones/:milestoneId')
	@ApiOperation(GroupSubmissionStudentDocs.create)
	async create(
		@Param('groupId') groupId: string,
		@Param('milestoneId') milestoneId: string,
		@Body() createSubmissionDto: CreateSubmissionDto,
		@Req() req: Request,
	) {
		const user = req.user as UserPayload;
		return await this.service.create(
			groupId,
			milestoneId,
			createSubmissionDto,
			user.id,
		);
	}

	@Roles(Role.STUDENT)
	@HttpCode(HttpStatus.OK)
	@Put(':groupId/milestones/:milestoneId')
	@ApiOperation(GroupSubmissionStudentDocs.update)
	async update(
		@Param('groupId') groupId: string,
		@Param('milestoneId') milestoneId: string,
		@Body() updateSubmissionDto: UpdateSubmissionDto,
		@Req() req: Request,
	) {
		const user = req.user as UserPayload;
		return await this.service.update(
			groupId,
			milestoneId,
			updateSubmissionDto,
			user.id,
		);
	}
}
