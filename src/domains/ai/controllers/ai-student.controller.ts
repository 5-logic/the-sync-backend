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
import { ApiArrayResponse, ApiBaseResponse } from '@/common';

@UseGuards(JwtAccessAuthGuard)
@ApiBearerAuth()
@ApiTags(AI_API_TAGS)
@Controller(AI_CONSTANTS.STUDENTS)
export class AIStudentController {
	constructor(private readonly service: AIStudentService) {}

	@HttpCode(HttpStatus.OK)
	@Get('suggest-for-group/:groupId')
	@ApiOperation(AIStudentDocs.suggestStudentsForGroup)
	@ApiArrayResponse(Object, HttpStatus.OK)
	async suggestStudentsForGroup(@Param('groupId') groupId: string) {
		return this.service.suggestStudentsForGroup(groupId);
	}

	@HttpCode(HttpStatus.OK)
	@Post('suggest-groups-for-student')
	@ApiOperation(AIStudentDocs.suggestGroupsForStudent)
	@ApiArrayResponse(Object, HttpStatus.OK)
	async suggestGroupsForStudent(@Body() dto: SuggestGroupsForStudentDto) {
		return this.service.suggestGroupsForStudent(dto.studentId, dto.semesterId);
	}

	@HttpCode(HttpStatus.OK)
	@Get('compatibility/:studentId/:groupId')
	@ApiOperation(AIStudentDocs.getStudentGroupCompatibility)
	@ApiBaseResponse(Object, HttpStatus.OK)
	async getStudentGroupCompatibility(
		@Param('studentId') studentId: string,
		@Param('groupId') groupId: string,
	) {
		return this.service.getStudentGroupCompatibility(studentId, groupId);
	}
}
