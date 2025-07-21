import { PartialType } from '@nestjs/swagger';

import { CreateReviewItemDto } from '@/reviews/dto';

export class UpdateReviewItemDto extends PartialType(CreateReviewItemDto) {}
