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

	@Roles(Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Get('check-duplicates/:thesisId')
	@ApiOperation(AIThesisDocs.checkDuplicates)
	@ApiArrayResponse(DuplicateThesisResponse, HttpStatus.OK)
	async checkDuplicates(
		@Param('thesisId') thesisId: string,
	): Promise<DuplicateThesisResponse[]> {
		return await this.service.checkDuplicates(thesisId);
	}
}
