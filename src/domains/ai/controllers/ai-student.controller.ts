import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AI_API_TAGS, AI_CONSTANTS } from '@/ai/constants';
import { AIStudentDocs } from '@/ai/docs';
import { SuggestGroupsForStudentDto } from '@/ai/dtos';
import { AIStudentService } from '@/ai/services';
import { JwtAccessAuthGuard } from '@/auth/guards';

@UseGuards(JwtAccessAuthGuard)
@ApiBearerAuth()
@ApiTags(AI_API_TAGS)
@Controller(AI_CONSTANTS.STUDENTS)
export class AIStudentController {
	constructor(private readonly service: AIStudentService) {}

	@HttpCode(HttpStatus.OK)
	@Get('suggest-for-group/:groupId')
	@ApiOperation(AIStudentDocs.suggestStudentsForGroup)
	async suggestStudentsForGroup(@Param('groupId') groupId: string) {
		return this.service.suggestStudentsForGroup(groupId);
	}

	@HttpCode(HttpStatus.OK)
	@Post('suggest-groups-for-student')
	@ApiOperation(AIStudentDocs.suggestGroupsForStudent)
	async suggestGroupsForStudent(@Body() dto: SuggestGroupsForStudentDto) {
		return this.service.suggestGroupsForStudent(dto.studentId, dto.semesterId);
	}
}
