import { PartialType } from '@nestjs/swagger';

import { CreateReviewDto } from '@/reviews/dto';

export class UpdateReviewDto extends PartialType(CreateReviewDto) {}
