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
import { AIStudentDocs } from '@/ai/docs';
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
