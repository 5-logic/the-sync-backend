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
import { SubmissionPublicDocs } from '@/submissions/docs';
import { SubmissionPublicService } from '@/submissions/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Submission')
@Controller('submissions')
export class SubmissionPublicController {
	constructor(private readonly service: SubmissionPublicService) {}

	@HttpCode(HttpStatus.OK)
	@Get()
	@ApiOperation(SubmissionPublicDocs.findAll)
	async findAll() {
		return await this.service.findAll();
	}

	@HttpCode(HttpStatus.OK)
	@Get(':id')
	@ApiOperation(SubmissionPublicDocs.findDetail)
	async findDetail(@Param('id') id: string) {
		return await this.service.findDetail(id);
	}

	@HttpCode(HttpStatus.OK)
	@Get('semester/:semesterId')
	@ApiOperation(SubmissionPublicDocs.findAllBySemester)
	async getSubmissionsBySemester(@Param('semesterId') semesterId: string) {
		return await this.service.getSubmissionsForReview(semesterId);
	}

	@HttpCode(HttpStatus.OK)
	@Get('milestone/:milestoneId')
	@ApiOperation(SubmissionPublicDocs.findAllByMilestone)
	async getSubmissionsByMilestone(@Param('milestoneId') milestoneId: string) {
		return await this.service.getSubmissionsForReview(undefined, milestoneId);
	}

	@HttpCode(HttpStatus.OK)
	@Get('semester/:semesterId/milestone/:milestoneId')
	@ApiOperation(SubmissionPublicDocs.findAllBySemesterAndMilestone)
	async getSubmissionsBySemesterAndMilestone(
		@Param('semesterId') semesterId: string,
		@Param('milestoneId') milestoneId: string,
	) {
		return await this.service.getSubmissionsForReview(semesterId, milestoneId);
	}
}
