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
	MILESTONE_API_TAGS,
	MILESTONE_CONSTANTS,
} from '@/milestones/constants';
import { MilestonePublicDocs } from '@/milestones/docs';
import { MilestoneResponse } from '@/milestones/responses';
import { MilestonePublicService } from '@/milestones/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(MILESTONE_API_TAGS)
@Controller(MILESTONE_CONSTANTS.BASE)
export class MilestonePublicController {
	constructor(private readonly service: MilestonePublicService) {}

	@HttpCode(HttpStatus.OK)
	@Get()
	@ApiOperation(MilestonePublicDocs.findAll)
	@ApiArrayResponse(MilestoneResponse, HttpStatus.OK)
	async findAll(): Promise<MilestoneResponse[]> {
		return await this.service.findAll();
	}

	@HttpCode(HttpStatus.OK)
	@Get('/semester/:semesterId')
	@ApiOperation(MilestonePublicDocs.findBySemester)
	@ApiArrayResponse(MilestoneResponse, HttpStatus.OK)
	async findBySemester(
		@Param('semesterId') semesterId: string,
	): Promise<MilestoneResponse[]> {
		return await this.service.findBySemester(semesterId);
	}

	@HttpCode(HttpStatus.OK)
	@Get(':id')
	@ApiOperation(MilestonePublicDocs.findOne)
	@ApiBaseResponse(MilestoneResponse, HttpStatus.OK)
	async findOne(@Param('id') id: string): Promise<MilestoneResponse> {
		return await this.service.findOne(id);
	}
}
