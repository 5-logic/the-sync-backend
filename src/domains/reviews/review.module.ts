import { Module } from '@nestjs/common';

import { ReviewController } from '@/reviews/review.controller';
import { ReviewService } from '@/reviews/review.service';

@Module({
	controllers: [ReviewController],
	providers: [ReviewService],
})
export class ReviewModule {}
