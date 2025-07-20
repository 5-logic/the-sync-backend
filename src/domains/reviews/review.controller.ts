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

import {
	JwtAccessAuthGuard,
	Role,
	RoleGuard,
	Roles,
	UserPayload,
} from '@/auth';
import { SwaggerDoc } from '@/common/docs';
import {
	AssignBulkLecturerReviewerDto,
	CreateReviewDto,
	UpdateReviewDto,
	UpdateReviewerAssignmentDto,
} from '@/reviews/dto';
import { ReviewService } from '@/reviews/review.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Review')
@Controller('reviews')
export class ReviewController {
	constructor(private readonly reviewService: ReviewService) {}

	@Roles(Role.MODERATOR)
	@Get(':submissionId/eligible-reviewers')
	@SwaggerDoc('review', 'getEligibleReviewers')
	async getEligibleReviewers(@Param('submissionId') submissionId: string) {
		return await this.reviewService.getEligibleReviewers(submissionId);
	}

	@Roles(Role.MODERATOR)
	@Post('assign-reviewer')
	@SwaggerDoc('review', 'assignBulkReviewer')
	async assignBulkReviewer(@Body() assignDto: AssignBulkLecturerReviewerDto) {
		return await this.reviewService.assignBulkReviewer(assignDto);
	}

	@Roles(Role.MODERATOR)
	@Put(':id/change-reviewer')
	@SwaggerDoc('review', 'changeReviewer')
	async changeReviewer(
		@Param('id') submissionId: string,
		@Body() updateDto: UpdateReviewerAssignmentDto,
	) {
		return await this.reviewService.changeReviewer(submissionId, updateDto);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@Get('assigned')
	@SwaggerDoc('review', 'getAssignedReviews')
	async getAssignedReviews(@Req() req: Request) {
		const user = req.user as UserPayload;

		return await this.reviewService.getAssignedReviews(user.id);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@Get(':submissionId/form')
	@SwaggerDoc('review', 'findOne')
	async getReviewForm(@Param('submissionId') submissionId: string) {
		return await this.reviewService.getReviewForm(submissionId);
	}

	@Get('groups/:groupId')
	@SwaggerDoc('review', 'getGroupReviewers')
	async getGroupReviewers(@Param('groupId') groupId: string) {
		return await this.reviewService.getGroupReviewers(groupId);
	}

	@Roles(Role.LECTURER)
	@Post(':submissionId')
	@SwaggerDoc('review', 'submitReview')
	async submitReview(
		@Req() req: Request,
		@Param('submissionId') submissionId: string,
		@Body() reviewDto: CreateReviewDto,
	) {
		const user = req.user as UserPayload;

		return await this.reviewService.submitReview(
			user.id,
			submissionId,
			reviewDto,
		);
	}

	@Roles(Role.LECTURER)
	@Put(':id')
	@SwaggerDoc('review', 'updateReview')
	async updateReview(
		@Req() req: Request,
		@Param('id') reviewId: string,
		@Body() updateDto: UpdateReviewDto,
	) {
		const user = req.user as UserPayload;

		return await this.reviewService.updateReview(user.id, reviewId, updateDto);
	}

	@Roles(Role.STUDENT, Role.LECTURER, Role.MODERATOR)
	@Get('groups/:groupId/submissions/:submissionId/reviews')
	@SwaggerDoc('review', 'findBySubmission')
	async getSubmissionReviews(
		@Param('groupId') groupId: string,
		@Param('submissionId') submissionId: string,
	) {
		return await this.reviewService.getSubmissionReviews(groupId, submissionId);
	}
}
