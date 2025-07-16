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
import {
	RESPONSIBILITY_API_TAGS,
	RESPONSIBILITY_CONSTANTS,
} from '@/responsibilities/constants';
import { ResponsibilityDocs } from '@/responsibilities/docs';
import { ResponsibilityResponse } from '@/responsibilities/responses';
import { ResponsibilityService } from '@/responsibilities/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(RESPONSIBILITY_API_TAGS)
@Controller(RESPONSIBILITY_CONSTANTS.BASE)
export class ResponsibilityController {
	constructor(private readonly service: ResponsibilityService) {}

	@HttpCode(HttpStatus.OK)
	@Get()
	@ApiOperation(ResponsibilityDocs.findAll)
	@ApiArrayResponse(ResponsibilityResponse, HttpStatus.OK)
	async findAll(): Promise<ResponsibilityResponse[]> {
		return await this.service.findAll();
	}

	@HttpCode(HttpStatus.OK)
	@Get(':id')
	@ApiOperation(ResponsibilityDocs.findOne)
	@ApiBaseResponse(ResponsibilityResponse, HttpStatus.OK)
	async findOne(@Param('id') id: string): Promise<ResponsibilityResponse> {
		return await this.service.findOne(id);
	}
}
