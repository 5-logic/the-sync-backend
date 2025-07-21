import { Module } from '@nestjs/common';

import { PrismaModule } from '@/providers/prisma/prisma.module';
import { ReviewController } from '@/reviews/review.controller';
import { ReviewService } from '@/reviews/review.service';

@Module({
	imports: [PrismaModule],
	controllers: [ReviewController],
	providers: [ReviewService],
})
export class ReviewModule {}
