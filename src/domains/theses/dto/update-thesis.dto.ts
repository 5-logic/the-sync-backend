import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsBoolean, ValidateNested } from 'class-validator';

import { CreateThesisDto } from '@/theses/dto/create-thesis.dto';

export class UpdateThesisDto extends PartialType(CreateThesisDto) {}

export class PublishThesisDto {
	@ApiProperty({ required: true })
	@IsArray()
	@ValidateNested({ each: true })
	thesesIds: string[];

	@ApiProperty({ required: true })
	@IsBoolean()
	isPublish: boolean;
}
