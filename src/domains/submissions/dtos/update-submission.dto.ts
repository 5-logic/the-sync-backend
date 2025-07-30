import { PartialType } from '@nestjs/swagger';

import { CreateSubmissionDto } from '@/submissions/dtos/create-submission.dto';

export class UpdateSubmissionDto extends PartialType(CreateSubmissionDto) {}
