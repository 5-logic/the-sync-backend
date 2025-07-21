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
import { SwaggerDoc } from '@/common/docs/swagger-docs.decorator';
import { CreateSubmissionDto, UpdateSubmissionDto } from '@/submissions/dto';
import { SubmissionService } from '@/submissions/submission.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Submission')
@Controller('submissions')
export class SubmissionController {
	constructor(private readonly submissionService: SubmissionService) {}

	@Roles(Role.ADMIN, Role.LECTURER)
	@Get()
	@SwaggerDoc('submission', 'findAll')
	async findAll(@Req() req: Request) {
		const user = req.user as UserPayload;
		return await this.submissionService.findAll(user.id);
	}

	@Get(':id')
	@SwaggerDoc('submission', 'findDetail')
	async findDetail(@Param('id') id: string) {
		return await this.submissionService.findDetail(id);
	}

	@Roles(Role.MODERATOR)
	@Get('semester/:semesterId')
	@SwaggerDoc('submission', 'findAllBySemester')
	async getSubmissionsBySemester(@Param('semesterId') semesterId: string) {
		return await this.submissionService.getSubmissionsForReview(semesterId);
	}

	@Roles(Role.MODERATOR)
	@Get('milestone/:milestoneId')
	@SwaggerDoc('submission', 'findAllByMilestone')
	async getSubmissionsByMilestone(@Param('milestoneId') milestoneId: string) {
		return await this.submissionService.getSubmissionsForReview(
			undefined,
			milestoneId,
		);
	}

	@Roles(Role.MODERATOR)
	@Get('semester/:semesterId/milestone/:milestoneId')
	@SwaggerDoc('submission', 'findAllBySemesterAndMilestone')
	async getSubmissionsBySemesterAndMilestone(
		@Param('semesterId') semesterId: string,
		@Param('milestoneId') milestoneId: string,
	) {
		return await this.submissionService.getSubmissionsForReview(
			semesterId,
			milestoneId,
		);
	}
}

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Group Submissions')
@Controller('groups')
export class GroupSubmissionController {
	constructor(private readonly submissionService: SubmissionService) {}

	@Get(':groupId/submissions')
	@SwaggerDoc('submission', 'findByGroupId')
	async findGroupSubmissions(
		@Param('groupId') groupId: string,
		@Req() req: Request,
	) {
		const user = req.user as UserPayload;
		return await this.submissionService.findByGroupId(groupId, user.id);
	}

	@Get(':groupId/milestones/:milestoneId')
	@SwaggerDoc('submission', 'findOne')
	async findSubmissionForMilestone(
		@Param('groupId') groupId: string,
		@Param('milestoneId') milestoneId: string,
		@Req() req: Request,
	) {
		const user = req.user as UserPayload;
		return await this.submissionService.findOne(groupId, milestoneId, user.id);
	}

	@Roles(Role.STUDENT)
	@Post(':groupId/milestones/:milestoneId')
	@SwaggerDoc('submission', 'create')
	async createSubmissionForMilestone(
		@Param('groupId') groupId: string,
		@Param('milestoneId') milestoneId: string,
		@Body() createSubmissionDto: CreateSubmissionDto,
		@Req() req: Request,
	) {
		const user = req.user as UserPayload;
		return await this.submissionService.create(
			groupId,
			milestoneId,
			createSubmissionDto,
			user.id,
		);
	}

	@Roles(Role.STUDENT)
	@Put(':groupId/milestones/:milestoneId')
	@SwaggerDoc('submission', 'update')
	async updateSubmissionForMilestone(
		@Param('groupId') groupId: string,
		@Param('milestoneId') milestoneId: string,
		@Body() updateSubmissionDto: UpdateSubmissionDto,
		@Req() req: Request,
	) {
		const user = req.user as UserPayload;
		return await this.submissionService.update(
			groupId,
			milestoneId,
			updateSubmissionDto,
			user.id,
		);
	}
}
