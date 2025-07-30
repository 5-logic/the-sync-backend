import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, RoleGuard } from '@/auth';
import { REVIEW_API_TAGS, REVIEW_CONSTANTS } from '@/reviews/constants';
import { ReviewPublicDocs } from '@/reviews/docs';
import { ReviewPublicService } from '@/reviews/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(REVIEW_API_TAGS)
@Controller(REVIEW_CONSTANTS.BASE)
export class ReviewPublicController {
	constructor(private readonly service: ReviewPublicService) {}

	@HttpCode(HttpStatus.OK)
	@Get('submissions/:submissionId/reviews')
	@ApiOperation(ReviewPublicDocs.getSubmissionReviews)
	async getSubmissionReviews(@Param('submissionId') submissionId: string) {
		return await this.service.getSubmissionReviews(submissionId);
	}
}
