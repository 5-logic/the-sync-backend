import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
} from '@nestjs/common';

import { CreateReviewDto, UpdateReviewDto } from '@/reviews/dto';
import { ReviewService } from '@/reviews/review.service';

@Controller('review')
export class ReviewController {
	constructor(private readonly reviewService: ReviewService) {}

	@Post()
	create(@Body() createReviewDto: CreateReviewDto) {
		return this.reviewService.create(createReviewDto);
	}

	@Get()
	findAll() {
		return this.reviewService.findAll();
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.reviewService.findOne(+id);
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
		return this.reviewService.update(+id, updateReviewDto);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.reviewService.remove(+id);
	}
}
