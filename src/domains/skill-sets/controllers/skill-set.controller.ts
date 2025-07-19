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
	SKILL_SET_API_TAGS,
	SKILL_SET_CONSTANTS,
} from '@/skill-sets/constants';
import { SkillSetDocs } from '@/skill-sets/docs';
import { SkillSetReponse } from '@/skill-sets/responses';
import { SkillSetService } from '@/skill-sets/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(SKILL_SET_API_TAGS)
@Controller(SKILL_SET_CONSTANTS.BASE)
export class SkillSetController {
	constructor(private readonly service: SkillSetService) {}

	@HttpCode(HttpStatus.OK)
	@Get()
	@ApiOperation(SkillSetDocs.findAll)
	@ApiArrayResponse(SkillSetReponse, HttpStatus.OK)
	async findAll(): Promise<SkillSetReponse[]> {
		return await this.service.findAll();
	}

	@HttpCode(HttpStatus.OK)
	@Get(':id')
	@ApiOperation(SkillSetDocs.findOne)
	@ApiBaseResponse(SkillSetReponse, HttpStatus.OK)
	async findOne(@Param('id') id: string): Promise<SkillSetReponse> {
		return await this.service.findOne(id);
	}
}
