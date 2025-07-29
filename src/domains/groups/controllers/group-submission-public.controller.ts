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
import {
	GROUP_SUBMISSION_API_TAGS,
	GROUP_SUBMISSION_CONSTANTS,
} from '@/groups/constants';
import { GroupSubmissionPublicDocs } from '@/groups/docs';
import { GroupSubmissionPublicService } from '@/groups/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(GROUP_SUBMISSION_API_TAGS)
@Controller(GROUP_SUBMISSION_CONSTANTS.BASE)
export class GroupSubmissionPublicController {
	constructor(private readonly service: GroupSubmissionPublicService) {}

	@HttpCode(HttpStatus.OK)
	@Get(':groupId/submissions')
	@ApiOperation(GroupSubmissionPublicDocs.findGroupSubmissions)
	async findGroupSubmissions(@Param('groupId') groupId: string) {
		return await this.service.findGroupSubmissions(groupId);
	}

	@HttpCode(HttpStatus.OK)
	@Get(':groupId/milestones/:milestoneId')
	@ApiOperation(GroupSubmissionPublicDocs.findSubmissionForMilestone)
	async findSubmissionForMilestone(
		@Param('groupId') groupId: string,
		@Param('milestoneId') milestoneId: string,
	) {
		return await this.service.findSubmissionForMilestone(groupId, milestoneId);
	}
}
