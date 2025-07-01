import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, ValidateNested } from 'class-validator';

export class PublishThesisDto {
	@ApiProperty({ required: true })
	@IsArray()
	@ValidateNested({ each: true })
	thesesIds: string[];

	@ApiProperty({ required: true })
	@IsBoolean()
	isPublish: boolean;
}
