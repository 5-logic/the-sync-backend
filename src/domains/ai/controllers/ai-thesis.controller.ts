import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { AI_API_TAGS, AI_CONSTANTS } from '@/ai/constants';
import { AIThesisDocs } from '@/ai/docs';
import { DuplicateThesisResponse } from '@/ai/responses';
import { AIStatisticsService, AIThesisService } from '@/ai/services';
import {
	JwtAccessAuthGuard,
	Role,
	RoleGuard,
	Roles,
	UserPayload,
} from '@/auth';
import { ApiArrayResponse } from '@/common';

import { AIAPIType } from '~/generated/prisma';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(AI_API_TAGS)
@Controller(AI_CONSTANTS.THESIS)
export class AIThesisController {
	constructor(
		private readonly service: AIThesisService,
		private readonly statisticsService: AIStatisticsService,
	) {}

	@Roles(Role.MODERATOR, Role.LECTURER)
	@HttpCode(HttpStatus.OK)
	@Get('check-duplicate/:thesisId')
	@ApiOperation(AIThesisDocs.checkDuplicate)
	@ApiArrayResponse(DuplicateThesisResponse, HttpStatus.OK)
	async checkDuplicate(
		@Param('thesisId') thesisId: string,
		@Req() req: Request,
	): Promise<DuplicateThesisResponse[]> {
		const user = req.user as UserPayload;

		// Get semester from thesis and log AI API call
		const thesis = await this.service.getThesis(thesisId);
		await this.statisticsService.logAIAPICall(
			user.id,
			thesis.semesterId,
			AIAPIType.CheckDuplicateThesis,
		);

		return await this.service.checkDuplicate(thesisId);
	}

	@HttpCode(HttpStatus.OK)
	@Get('suggest-for-group/:groupId')
	@ApiOperation(AIThesisDocs.suggestThesesForGroup)
	@ApiArrayResponse(Object, HttpStatus.OK)
	async suggestThesesForGroup(
		@Param('groupId') groupId: string,
		@Req() req: Request,
	) {
		const user = req.user as UserPayload;

		// Get semester from group and log AI API call
		const group = await this.service.getGroup(groupId);
		await this.statisticsService.logAIAPICall(
			user.id,
			group.semesterId,
			AIAPIType.SuggestThesis,
		);

		return await this.service.suggestThesesForGroup(groupId);
	}
}
