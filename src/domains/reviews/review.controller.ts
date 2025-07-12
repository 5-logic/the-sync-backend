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
import { SwaggerDoc } from '@/common/docs';
import {
	AssignLecturerReviewerDto,
	CreateReviewDto,
	UpdateReviewDto,
} from '@/reviews/dto';
import { ReviewService } from '@/reviews/review.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Review')
@Controller()
export class ReviewController {
	constructor(private readonly reviewService: ReviewService) {}

	@Roles(Role.MODERATOR)
	@Get('')
	@SwaggerDoc('review', 'findAll')
	async getSubmissionsForReview() {
		return await this.reviewService.getSubmissionsForReview();
	}

	@Roles(Role.MODERATOR)
	@Get(':id/eligible-reviewers')
	@SwaggerDoc('review', 'getEligibleReviewers')
	async getEligibleReviewers(@Param('id') submissionId: string) {
		return await this.reviewService.getEligibleReviewers(submissionId);
	}

	@Roles(Role.MODERATOR)
	@Post(':id/assign-reviewer')
	@SwaggerDoc('review', 'create')
	async assignReviewer(
		@Param('id') submissionId: string,
		@Body() assignDto: AssignLecturerReviewerDto,
	) {
		return await this.reviewService.assignReviewer(submissionId, assignDto);
	}

	@Roles(Role.MODERATOR)
	@Delete(':id/assign-reviewer')
	@SwaggerDoc('review', 'remove')
	async unassignReviewer(@Param('id') submissionId: string) {
		return await this.reviewService.unassignReviewer(submissionId);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@Get('reviews/assigned')
	@SwaggerDoc('review', 'getAssignedReviews')
	async getAssignedReviews(@Req() req: Request) {
		const user = req.user as UserPayload;

		return await this.reviewService.getAssignedReviews(user.id);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@Get('reviews/:submissionId/form')
	@SwaggerDoc('review', 'findOne')
	async getReviewForm(@Param('submissionId') submissionId: string) {
		return await this.reviewService.getReviewForm(submissionId);
	}

	@Roles(Role.LECTURER)
	@Post('reviews/:submissionId')
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
	@Put('reviews/:id')
	@SwaggerDoc('review', 'update')
	async updateReview(
		@Req() req: Request,
		@Param('id') reviewId: string,
		@Body() updateDto: UpdateReviewDto,
	) {
		const user = req.user as UserPayload;

		return await this.reviewService.updateReview(user.id, reviewId, updateDto);
	}

	@Roles(Role.STUDENT)
	@Get('groups/:groupId/submissions/:submissionId/reviews')
	@SwaggerDoc('review', 'findBySubmission')
	async getSubmissionReviews(
		@Param('groupId') groupId: string,
		@Param('submissionId') submissionId: string,
	) {
		return await this.reviewService.getSubmissionReviews(groupId, submissionId);
	}
}
