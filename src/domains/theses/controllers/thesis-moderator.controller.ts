import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { ApiBaseResponse, ApiEmptyResponse } from '@/common';
import { THESIS_API_TAGS, THESIS_CONSTANTS } from '@/theses/constants';
import { ThesisModeratorDocs } from '@/theses/docs';
import { PublishThesisDto, ReviewThesisDto } from '@/theses/dtos';
import { ThesisDetailResponse } from '@/theses/responses';
import { ThesisModeratorService } from '@/theses/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(THESIS_API_TAGS)
@Controller(THESIS_CONSTANTS.BASE)
export class ThesisModeratorController {
	constructor(private readonly service: ThesisModeratorService) {}

	@Roles(Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Post('publish')
	@ApiOperation(ThesisModeratorDocs.publishTheses)
	@ApiEmptyResponse(HttpStatus.OK)
	async publishTheses(@Body() dto: PublishThesisDto): Promise<void> {
		return await this.service.publishTheses(dto);
	}

	@Roles(Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Post(':id/review')
	@ApiOperation(ThesisModeratorDocs.reviewThesis)
	@ApiBaseResponse(ThesisDetailResponse, HttpStatus.OK)
	async reviewThesis(
		@Param('id') id: string,
		@Body() dto: ReviewThesisDto,
	): Promise<ThesisDetailResponse> {
		return await this.service.reviewThesis(id, dto);
	}
}
