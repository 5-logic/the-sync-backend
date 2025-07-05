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
import { SupervisionService } from '@/domains/supervisions/supervision.service';
import { AssignSupervisionDto } from '@/supervisions/dto/assign-supervision.dto';
import { ChangeSupervisionDto } from '@/supervisions/dto/change-supervision.dto';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Supervision')
@Controller('supervisions')
export class SupervisionController {
	constructor(private readonly supervisionsService: SupervisionService) {}

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

	@Get('thesis/:thesisId')
	async getSupervisionsByThesis(@Param('thesisId') thesisId: string) {
		return await this.supervisionsService.getSupervisionsByThesis(thesisId);
	}

	@Get('lecturer/:lecturerId')
	async getSupervisionsByLecturer(@Param('lecturerId') lecturerId: string) {
		return await this.supervisionsService.getSupervisionsByLecturer(lecturerId);
	}
}
