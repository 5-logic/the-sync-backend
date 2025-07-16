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
import { MAJOR_API_TAGS, MAJOR_CONSTANTS } from '@/majors/constants';
import { MajorDocs } from '@/majors/docs';
import { MajorResponse } from '@/majors/responses';
import { MajorService } from '@/majors/services';

@UseGuards(RoleGuard)
@UseGuards(JwtAccessAuthGuard)
@ApiBearerAuth()
@ApiTags(MAJOR_API_TAGS)
@Controller(MAJOR_CONSTANTS.BASE)
export class MajorController {
	constructor(private readonly service: MajorService) {}

	@HttpCode(HttpStatus.OK)
	@Get()
	@ApiOperation(MajorDocs.findAll)
	@ApiArrayResponse(MajorResponse, HttpStatus.OK)
	async findAll(): Promise<MajorResponse[]> {
		return await this.service.findAll();
	}

	@HttpCode(HttpStatus.OK)
	@Get(':id')
	@ApiOperation(MajorDocs.findOne)
	@ApiBaseResponse(MajorResponse, HttpStatus.OK)
	async findOne(@Param('id') id: string): Promise<MajorResponse> {
		return await this.service.findOne(id);
	}
}
