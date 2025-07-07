import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { SwaggerDoc } from '@/common/docs';
import { SupervisionService } from '@/domains/supervisions/supervision.service';
import { AssignSupervisionDto, ChangeSupervisionDto } from '@/supervisions/dto';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Supervision')
@Controller('supervisions')
export class SupervisionController {
	constructor(private readonly supervisionsService: SupervisionService) {}

	@SwaggerDoc('supervision', 'assignSupervisor')
	@Roles(Role.MODERATOR)
	@Post('assign/:thesisId')
	async assignSupervisor(
		@Param('thesisId') thesisId: string,
		@Body() assignSupervisionDto: AssignSupervisionDto,
	) {
		return await this.supervisionsService.assignSupervisor(
			thesisId,
			assignSupervisionDto,
		);
	}

	@SwaggerDoc('supervision', 'changeSupervisor')
	@Roles(Role.MODERATOR)
	@Put('change/:thesisId')
	async changeSupervisor(
		@Param('thesisId') thesisId: string,
		@Body() changeSupervisionDto: ChangeSupervisionDto,
	) {
		return await this.supervisionsService.changeSupervisor(
			thesisId,
			changeSupervisionDto,
		);
	}

	@SwaggerDoc('supervision', 'removeSupervisor')
	@Roles(Role.MODERATOR)
	@Delete('remove/:thesisId/:lecturerId')
	async removeSupervisor(
		@Param('thesisId') thesisId: string,
		@Param('lecturerId') lecturerId: string,
	) {
		return await this.supervisionsService.removeSupervisor(
			thesisId,
			lecturerId,
		);
	}

	@SwaggerDoc('supervision', 'getSupervisionsByThesis')
	@Get('thesis/:thesisId')
	async getSupervisionsByThesis(@Param('thesisId') thesisId: string) {
		return await this.supervisionsService.getSupervisionsByThesis(thesisId);
	}

	@SwaggerDoc('supervision', 'getSupervisionsByLecturer')
	@Get('lecturer/:lecturerId')
	async getSupervisionsByLecturer(@Param('lecturerId') lecturerId: string) {
		return await this.supervisionsService.getSupervisionsByLecturer(lecturerId);
	}
}
