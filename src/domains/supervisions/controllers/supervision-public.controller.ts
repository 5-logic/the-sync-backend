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
import { SupervisionPublicService } from '@/domains/supervisions/services';
import {
	SUPERVISION_API_TAGS,
	SUPERVISION_CONSTANTS,
} from '@/supervisions/constants';
import { SupervisionPublicDocs } from '@/supervisions/docs';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(SUPERVISION_API_TAGS)
@Controller(SUPERVISION_CONSTANTS.BASE)
export class SupervisionPublicController {
	constructor(private readonly service: SupervisionPublicService) {}

	@HttpCode(HttpStatus.OK)
	@Get('thesis/:thesisId')
	@ApiOperation(SupervisionPublicDocs.getSupervisionsByThesis)
	async getSupervisionsByThesis(@Param('thesisId') thesisId: string) {
		return await this.service.getSupervisionsByThesis(thesisId);
	}

	@HttpCode(HttpStatus.OK)
	@Get('lecturer/:lecturerId')
	@ApiOperation(SupervisionPublicDocs.getSupervisionsByLecturer)
	async getSupervisionsByLecturer(@Param('lecturerId') lecturerId: string) {
		return await this.service.getSupervisionsByLecturer(lecturerId);
	}

	@HttpCode(HttpStatus.OK)
	@Get('lecturer/:lecturerId/groups')
	@ApiOperation(SupervisionPublicDocs.getSupervisionsGroupByLecturer)
	async getSupervisionsGroupByLecturer(
		@Param('lecturerId') lecturerId: string,
	) {
		return await this.service.getSupervisionsGroupByLecturer(lecturerId);
	}
}
