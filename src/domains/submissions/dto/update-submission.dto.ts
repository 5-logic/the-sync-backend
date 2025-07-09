import { PartialType } from '@nestjs/swagger';

import { CreateSubmissionDto } from '@/submissions/dto';

export class UpdateSubmissionDto extends PartialType(CreateSubmissionDto) {}
