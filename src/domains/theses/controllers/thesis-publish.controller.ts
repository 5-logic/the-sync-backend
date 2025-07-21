import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, RoleGuard } from '@/auth';
import { ApiArrayResponse, ApiBaseResponse } from '@/common';
import { THESIS_API_TAGS, THESIS_CONSTANTS } from '@/theses/constants';
import { ThesisPublishDocs } from '@/theses/docs';
import { ThesisDetailResponse } from '@/theses/responses';
import { ThesisPublishService } from '@/theses/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(THESIS_API_TAGS)
@Controller(THESIS_CONSTANTS.BASE)
export class ThesisPublishController {
	constructor(private readonly service: ThesisPublishService) {}

	@HttpCode(HttpStatus.OK)
	@Get()
	@ApiOperation(ThesisPublishDocs.findAll)
	@ApiArrayResponse(ThesisDetailResponse, HttpStatus.OK)
	async findAll(): Promise<ThesisDetailResponse[]> {
		return await this.service.findAll();
	}

	@HttpCode(HttpStatus.OK)
	@Get(':id')
	@ApiOperation(ThesisPublishDocs.findOne)
	@ApiBaseResponse(ThesisDetailResponse, HttpStatus.OK)
	async findOne(@Param('id') id: string): Promise<ThesisDetailResponse> {
		return await this.service.findOne(id);
	}

	@HttpCode(HttpStatus.OK)
	@Get('semester/:semesterId')
	@ApiOperation(ThesisPublishDocs.findAllBySemesterId)
	@ApiArrayResponse(ThesisDetailResponse, HttpStatus.OK)
	async findAllBySemesterId(
		@Param('semesterId') semesterId: string,
	): Promise<ThesisDetailResponse[]> {
		return await this.service.findAllBySemesterId(semesterId);
	}
}
