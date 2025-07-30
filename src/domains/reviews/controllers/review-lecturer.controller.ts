import {
	Body,
	Controller,
	Get,
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

import {
	JwtAccessAuthGuard,
	Role,
	RoleGuard,
	Roles,
	UserPayload,
} from '@/auth';
import { REVIEW_API_TAGS, REVIEW_CONSTANTS } from '@/reviews/constants';
import { ReviewLecturerDocs, ReviewModeratorDocs } from '@/reviews/docs';
import {
	AssignBulkLecturerReviewerDto,
	CreateReviewDto,
	UpdateReviewDto,
} from '@/reviews/dtos';
import {
	ReviewLecturerService,
	ReviewModeratorService,
} from '@/reviews/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(REVIEW_API_TAGS)
@Controller(REVIEW_CONSTANTS.BASE)
export class ReviewLecturerController {
	constructor(
		private readonly service: ReviewLecturerService,
		private readonly moderatorService: ReviewModeratorService,
	) {}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Get('assigned')
	@ApiOperation(ReviewLecturerDocs.getAssignedReviews)
	async getAssignedReviews(@Req() req: Request) {
		const user = req.user as UserPayload;

		return await this.service.getAssignedReviews(user.id);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Get(':submissionId/form')
	@ApiOperation(ReviewLecturerDocs.getReviewForm)
	async getReviewForm(@Param('submissionId') submissionId: string) {
		return await this.service.getReviewForm(submissionId);
	}

	@Roles(Role.MODERATOR)
	@HttpCode(HttpStatus.CREATED)
	@Post('assign-reviewer')
	@ApiOperation(ReviewModeratorDocs.assignBulkReviewer)
	async assignBulkReviewer(@Body() assignDto: AssignBulkLecturerReviewerDto) {
		return await this.moderatorService.assignBulkReviewer(assignDto);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@HttpCode(HttpStatus.CREATED)
	@Post(':submissionId')
	@ApiOperation(ReviewLecturerDocs.submitReview)
	async submitReview(
		@Req() req: Request,
		@Param('submissionId') submissionId: string,
		@Body() reviewDto: CreateReviewDto,
	) {
		const user = req.user as UserPayload;

		return await this.service.submitReview(user.id, submissionId, reviewDto);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Put(':id')
	@ApiOperation(ReviewLecturerDocs.updateReview)
	async updateReview(
		@Req() req: Request,
		@Param('id') reviewId: string,
		@Body() updateDto: UpdateReviewDto,
	) {
		const user = req.user as UserPayload;

		return await this.service.updateReview(user.id, reviewId, updateDto);
	}
}
