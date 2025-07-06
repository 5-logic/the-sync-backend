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
import { CreateSemesterDto, UpdateSemesterDto } from '@/semesters/dto';
import { SemesterService } from '@/semesters/semester.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Semester')
@Controller('semesters')
export class SemesterController {
	constructor(private readonly semesterService: SemesterService) {}

	@Roles(Role.ADMIN)
	@Post()
	@ApiOperation({
		summary: 'Create semester',
		description:
			'Create a new academic semester with unique name and code. Only administrators can create semesters. Validates that no other semester is currently active (status other than NotYet or End) before allowing creation. System automatically sets initial status to NotYet.',
	})
	async create(@Body() dto: CreateSemesterDto) {
		return await this.semesterService.create(dto);
	}

	@Get()
	@ApiOperation({
		summary: 'Get all semesters',
		description:
			'Retrieve all academic semesters in the system ordered by creation date (newest first). Returns comprehensive semester information including status, group limits, and phase details.',
	})
	async findAll() {
		return await this.semesterService.findAll();
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Get semester by ID',
		description:
			'Retrieve detailed information about a specific semester by its unique identifier. Returns complete semester data including status, phase, group limits, and thesis quotas.',
	})
	async findOne(@Param('id') id: string) {
		return await this.semesterService.findOne(id);
	}

	@Roles(Role.ADMIN)
	@Put(':id')
	@ApiOperation({
		summary: 'Update semester',
		description:
			'Update semester information including status transitions, group limits, and ongoing phase settings. Only administrators can update semesters. Enforces strict business rules for status transitions (NotYet → Preparing → Picking → Ongoing → End). Validates phase changes and automatically updates student enrollment statuses when transitioning to Ongoing. Sends email notifications to students when semester becomes active.',
	})
	async update(@Param('id') id: string, @Body() dto: UpdateSemesterDto) {
		return await this.semesterService.update(id, dto);
	}

	@Roles(Role.ADMIN)
	@Delete(':id')
	@ApiOperation({
		summary: 'Delete semester',
		description:
			'Delete a semester from the system. Only administrators can delete semesters. Can only delete semesters with NotYet status and no existing relationships (no groups, enrollments, milestones, or student participations). Permanently removes the semester and all associated data.',
	})
	async remove(@Param('id') id: string) {
		return await this.semesterService.remove(id);
	}
}
