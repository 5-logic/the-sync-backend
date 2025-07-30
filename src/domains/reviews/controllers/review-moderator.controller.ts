import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Put,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { REVIEW_API_TAGS, REVIEW_CONSTANTS } from '@/reviews/constants';
import { ReviewModeratorDocs } from '@/reviews/docs';
import { UpdateReviewerAssignmentDto } from '@/reviews/dtos';
import { ReviewModeratorService } from '@/reviews/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(REVIEW_API_TAGS)
@Controller(REVIEW_CONSTANTS.BASE)
export class ReviewModeratorController {
	constructor(private readonly service: ReviewModeratorService) {}

	@Roles(Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Get(':submissionId/eligible-reviewers')
	@ApiOperation(ReviewModeratorDocs.getEligibleReviewers)
	async getEligibleReviewers(@Param('submissionId') submissionId: string) {
		return await this.service.getEligibleReviewers(submissionId);
	}

	@Roles(Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Put(':id/change-reviewer')
	@ApiOperation(ReviewModeratorDocs.changeReviewer)
	async changeReviewer(
		@Param('id') submissionId: string,
		@Body() updateDto: UpdateReviewerAssignmentDto,
	) {
		return await this.service.changeReviewer(submissionId, updateDto);
	}
}
