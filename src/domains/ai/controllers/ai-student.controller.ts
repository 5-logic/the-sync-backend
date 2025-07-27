import {
	Controller,
	Get,
	Param,
	Query,
	UseGuards,
	ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { AIStudentService } from '@/ai/services';
import { JwtAccessAuthGuard } from '@/auth/guards';

@ApiTags('AI Student Suggestions')
@Controller('ai/students')
@UseGuards(JwtAccessAuthGuard)
export class AIStudentController {
	constructor(private readonly aiStudentService: AIStudentService) {}

	@Get('suggest-for-group/:groupId')
	@ApiOperation({
		summary: 'Suggest students for a group',
		description:
			'Get AI-powered suggestions for students that would be a good fit for the specified group based on skills, responsibilities, and thesis content.',
	})
	@ApiParam({
		name: 'groupId',
		description: 'The ID of the group to suggest students for',
		type: 'string',
	})
	@ApiQuery({
		name: 'topK',
		description: 'Number of suggestions to return (default: 5)',
		required: false,
		type: 'number',
	})
	async suggestStudentsForGroup(
		@Param('groupId') groupId: string,
		@Query('topK', new ValidationPipe({ transform: true })) topK: number = 5,
	) {
		return this.aiStudentService.suggestStudentsForGroup(groupId, topK);
	}

	@Get('compatibility/:studentId/:groupId')
	@ApiOperation({
		summary: 'Analyze student-group compatibility',
		description:
			'Get detailed compatibility analysis between a specific student and group.',
	})
	@ApiParam({
		name: 'studentId',
		description: 'The ID of the student to analyze',
		type: 'string',
	})
	@ApiParam({
		name: 'groupId',
		description: 'The ID of the group to analyze compatibility with',
		type: 'string',
	})
	async getStudentGroupCompatibility(
		@Param('studentId') studentId: string,
		@Param('groupId') groupId: string,
	) {
		return this.aiStudentService.getStudentGroupCompatibility(
			studentId,
			groupId,
		);
	}
}
