import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { AI_API_TAGS, AI_CONSTANTS } from '@/ai/constants';
import { AIStudentDocs } from '@/ai/docs';
import { SuggestGroupsForStudentDto } from '@/ai/dtos';
import { AIStatisticsService, AIStudentService } from '@/ai/services';
import { JwtAccessAuthGuard, RoleGuard } from '@/auth/guards';
import { UserPayload } from '@/auth/interfaces';

import { AIAPIType } from '~/generated/prisma';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(AI_API_TAGS)
@Controller(AI_CONSTANTS.STUDENTS)
export class AIStudentController {
	constructor(
		private readonly service: AIStudentService,
		private readonly statisticsService: AIStatisticsService,
	) {}

	@HttpCode(HttpStatus.OK)
	@Get('suggest-for-group/:groupId')
	@ApiOperation(AIStudentDocs.suggestStudentsForGroup)
	async suggestStudentsForGroup(
		@Param('groupId') groupId: string,
		@Req() req: Request,
	) {
		const user = req.user as UserPayload;

		// Get semester from group and log AI API call
		const group = await this.service.getGroup(groupId);
		await this.statisticsService.logAIAPICall(
			user.id,
			group.semesterId,
			AIAPIType.SuggestParticipants,
		);

		return this.service.suggestStudentsForGroup(groupId);
	}

	@HttpCode(HttpStatus.OK)
	@Post('suggest-groups-for-student')
	@ApiOperation(AIStudentDocs.suggestGroupsForStudent)
	async suggestGroupsForStudent(
		@Body() dto: SuggestGroupsForStudentDto,
		@Req() req: Request,
	) {
		const user = req.user as UserPayload;

		// Log AI API call
		await this.statisticsService.logAIAPICall(
			user.id,
			dto.semesterId,
			AIAPIType.SuggestParticipants,
		);

		return this.service.suggestGroupsForStudent(dto.studentId, dto.semesterId);
	}
}
