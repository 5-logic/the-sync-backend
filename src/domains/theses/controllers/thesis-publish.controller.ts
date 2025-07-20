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
import { THESIS_API_TAGS, THESIS_CONSTANTS } from '@/theses/constants';
import { ThesisPublishDocs } from '@/theses/docs';
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
	async findAll() {
		return await this.service.findAll();
	}

	@HttpCode(HttpStatus.OK)
	@Get(':id')
	@ApiOperation(ThesisPublishDocs.findOne)
	async findOne(@Param('id') id: string) {
		return await this.service.findOne(id);
	}

	@HttpCode(HttpStatus.OK)
	@Get('semester/:semesterId')
	@ApiOperation(ThesisPublishDocs.findAllBySemesterId)
	async findAllBySemesterId(@Param('semesterId') semesterId: string) {
		return await this.service.findAllBySemesterId(semesterId);
	}
}
