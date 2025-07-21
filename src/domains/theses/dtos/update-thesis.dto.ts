import { PartialType } from '@nestjs/swagger';

import { CreateThesisDto } from '@/theses/dtos/create-thesis.dto';

export class UpdateThesisDto extends PartialType(CreateThesisDto) {}
