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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

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

	@ApiOperation({
		summary: 'Assign supervisor to thesis',
		description:
			'Assigns a lecturer as supervisor to a thesis project. This endpoint creates a new supervision relationship between a lecturer and a thesis. The requesting user must have MODERATOR role privileges. Validates that both thesis and lecturer exist, checks if lecturer has capacity for additional supervisions, and ensures no duplicate supervision exists. Creates supervision record with proper timestamps and status tracking. Used in thesis management workflow when assigning academic supervisors to student thesis projects.',
	})
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

	@ApiOperation({
		summary: 'Change thesis supervisor',
		description:
			'Changes the supervisor of a thesis by replacing the current supervisor with a new one. This endpoint updates an existing supervision relationship. The requesting user must have MODERATOR role privileges. Validates that both thesis and new lecturer exist, checks if new lecturer has capacity for additional supervisions, and ensures the new supervisor is different from current one. Updates supervision record with proper timestamps and maintains supervision history. Used in thesis management when reassigning academic supervision due to availability changes, expertise requirements, or administrative needs.',
	})
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

	@ApiOperation({
		summary: 'Remove supervisor from thesis',
		description:
			'Removes a lecturer from supervising a specific thesis by deleting the supervision relationship. This endpoint terminates the supervision assignment between a lecturer and thesis. The requesting user must have MODERATOR role privileges. Validates that both thesis and lecturer exist and that an active supervision relationship exists between them. Removes supervision record while maintaining audit trail. Used in thesis management when supervision needs to be terminated due to lecturer unavailability, thesis cancellation, or administrative restructuring.',
	})
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

	@ApiOperation({
		summary: 'Get supervisions by thesis',
		description:
			'Retrieves all supervision relationships for a specific thesis. This endpoint returns comprehensive information about all lecturers currently supervising or previously supervised the specified thesis. Includes supervision details such as supervisor information, assignment dates, status, and any supervision history. Used in thesis management to view supervision assignments, track supervisor changes, and manage academic oversight. Accessible to authenticated users with appropriate permissions.',
	})
	@Get('thesis/:thesisId')
	async getSupervisionsByThesis(@Param('thesisId') thesisId: string) {
		return await this.supervisionsService.getSupervisionsByThesis(thesisId);
	}

	@ApiOperation({
		summary: 'Get supervisions by lecturer',
		description:
			'Retrieves all supervision relationships for a specific lecturer. This endpoint returns comprehensive information about all theses currently or previously supervised by the specified lecturer. Includes supervision details such as thesis information, student details, assignment dates, status, and supervision workload metrics. Used in lecturer management to view supervision portfolio, track workload distribution, and manage academic assignments. Accessible to authenticated users with appropriate permissions.',
	})
	@Get('lecturer/:lecturerId')
	async getSupervisionsByLecturer(@Param('lecturerId') lecturerId: string) {
		return await this.supervisionsService.getSupervisionsByLecturer(lecturerId);
	}
}
