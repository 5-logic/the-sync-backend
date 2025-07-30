import {
	Body,
	Controller,
	Delete,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Put,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { SupervisionModeratorService } from '@/domains/supervisions/services';
import {
	SUPERVISION_API_TAGS,
	SUPERVISION_CONSTANTS,
} from '@/supervisions/constants';
import { SupervisionModeratorDocs } from '@/supervisions/docs';
import {
	AssignBulkSupervisionDto,
	ChangeSupervisionDto,
} from '@/supervisions/dtos';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(SUPERVISION_API_TAGS)
@Controller(SUPERVISION_CONSTANTS.BASE)
export class SupervisionModeratorController {
	constructor(private readonly service: SupervisionModeratorService) {}

	@Roles(Role.MODERATOR)
	@HttpCode(HttpStatus.CREATED)
	@Post('assign-supervisors')
	@ApiOperation(SupervisionModeratorDocs.assignBulkSupervisor)
	async assignBulkSupervisor(@Body() dto: AssignBulkSupervisionDto) {
		return await this.service.assignBulkSupervisor(dto);
	}

	@Roles(Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Put('change/:thesisId')
	@ApiOperation(SupervisionModeratorDocs.changeSupervisor)
	async changeSupervisor(
		@Param('thesisId') thesisId: string,
		@Body() changeSupervisionDto: ChangeSupervisionDto,
	) {
		return await this.service.changeSupervisor(thesisId, changeSupervisionDto);
	}

	@Roles(Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Delete('remove/:thesisId/:lecturerId')
	@ApiOperation(SupervisionModeratorDocs.removeSupervisor)
	async removeSupervisor(
		@Param('thesisId') thesisId: string,
		@Param('lecturerId') lecturerId: string,
	) {
		return await this.service.removeSupervisor(thesisId, lecturerId);
	}
}
