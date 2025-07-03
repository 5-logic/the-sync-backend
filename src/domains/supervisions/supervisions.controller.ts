import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Put,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { AssignSupervisionDto } from '@/supervisions/dto/assign-supervision.dto';
import { ChangeSupervisionDto } from '@/supervisions/dto/change-supervision.dto';
import { SupervisionsService } from '@/supervisions/supervisions.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Supervision')
@Controller('supervisions')
export class SupervisionsController {
	constructor(private readonly supervisionsService: SupervisionsService) {}

	@Roles(Role.MODERATOR)
	@Put('assign/:id')
	@ApiParam({ name: 'id', description: 'Thesis ID' })
	async assignSupervisor(
		@Param('id') id: string,
		@Body() assignSupervisionDto: AssignSupervisionDto,
	) {
		return await this.supervisionsService.assignSupervisor(
			id,
			assignSupervisionDto,
		);
	}

	@Roles(Role.MODERATOR)
	@Put('change/:id')
	async changeSupervisor(
		@Param('id') id: string,
		@Body() changeSupervisionDto: ChangeSupervisionDto,
	) {
		return await this.supervisionsService.changeSupervisor(
			id,
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

	@Get('thesis/:id')
	async getSupervisionsByThesis(@Param('id') id: string) {
		return await this.supervisionsService.getSupervisionsByThesis(id);
	}

	@Get('lecturer/:id')
	async getSupervisionsByLecturer(@Param('id') id: string) {
		return await this.supervisionsService.getSupervisionsByLecturer(id);
	}
}
