import { PartialType } from '@nestjs/swagger';

import { CreateThesisDto } from '@/theses/dto/create-thesis.dto';

export class UpdateThesisDto extends PartialType(CreateThesisDto) {}
