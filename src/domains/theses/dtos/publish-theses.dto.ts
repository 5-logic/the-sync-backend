import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsString } from 'class-validator';

export class PublishThesisDto {
	@ApiProperty({ required: true })
	@IsArray()
	@IsString({ each: true })
	thesisIds: string[];

	@ApiProperty({ required: true })
	@IsBoolean()
	isPublish: boolean;
}
