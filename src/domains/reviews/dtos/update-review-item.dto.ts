import { PartialType } from '@nestjs/swagger';

import { CreateReviewItemDto } from '@/reviews/dtos/create-review-item.dto';

export class UpdateReviewItemDto extends PartialType(CreateReviewItemDto) {}
