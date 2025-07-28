import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AI_API_TAGS, AI_CONSTANTS } from '@/ai/constants';
import { AIThesisDocs } from '@/ai/docs';
import { DuplicateThesisResponse } from '@/ai/responses';
import { AIThesisService } from '@/ai/services';
import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { ApiArrayResponse } from '@/common';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(AI_API_TAGS)
@Controller(AI_CONSTANTS.THESIS)
export class AIThesisController {
	constructor(private readonly service: AIThesisService) {}

	@Roles(Role.MODERATOR, Role.LECTURER)
	@HttpCode(HttpStatus.OK)
	@Get('check-duplicate/:thesisId')
	@ApiOperation(AIThesisDocs.checkDuplicate)
	@ApiArrayResponse(DuplicateThesisResponse, HttpStatus.OK)
	async checkDuplicate(
		@Param('thesisId') thesisId: string,
	): Promise<DuplicateThesisResponse[]> {
		return await this.service.checkDuplicate(thesisId);
	}

	@HttpCode(HttpStatus.OK)
	@Get('suggest-for-group/:groupId')
	@ApiOperation(AIThesisDocs.suggestThesesForGroup)
	@ApiArrayResponse(Object, HttpStatus.OK)
	async suggestThesesForGroup(@Param('groupId') groupId: string) {
		return await this.service.suggestThesesForGroup(groupId);
	}
}
