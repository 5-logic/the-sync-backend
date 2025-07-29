import { Module } from '@nestjs/common';

import {
	ReviewLecturerController,
	ReviewModeratorController,
	ReviewPublicController,
} from '@/reviews/controllers';
import {
	ReviewLecturerService,
	ReviewModeratorService,
	ReviewPublicService,
} from '@/reviews/services';
import { ReviewService } from '@/reviews/services/review.service';

@Module({
	controllers: [
		ReviewLecturerController,
		ReviewModeratorController,
		ReviewPublicController,
	],
	providers: [
		ReviewService,
		ReviewLecturerService,
		ReviewModeratorService,
		ReviewPublicService,
	],
})
export class ReviewModule {}
