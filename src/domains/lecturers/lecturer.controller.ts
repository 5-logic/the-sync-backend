import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import { ToggleLecturerStatusDto, UpdateLecturerDto } from '@/lecturers/dto';
import { LecturerService } from '@/lecturers/lecturer.service';
import { CreateUserDto, UpdateUserDto } from '@/users/dto';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Lecturer')
@Controller('lecturers')
export class LecturerController {
	constructor(private readonly lecturerService: LecturerService) {}

	@Roles(Role.ADMIN)
	@Post()
	@ApiOperation({
		summary: 'Create lecturer',
		description:
			'Create a new lecturer account and send welcome email with credentials.',
	})
	async create(@Body() dto: CreateUserDto) {
		return await this.lecturerService.create(dto);
	}

	@Roles(Role.ADMIN)
	@ApiBody({ type: [CreateUserDto] })
	@Post('import')
	@ApiOperation({
		summary: 'Import lecturers',
		description: 'Bulk create multiple lecturer accounts from array data.',
	})
	async createMany(@Body() dto: CreateUserDto[]) {
		return await this.lecturerService.createMany(dto);
	}

	@Get()
	@ApiOperation({
		summary: 'Get all lecturers',
		description: 'Retrieve all lecturers with their profile information.',
	})
	async findAll() {
		return await this.lecturerService.findAll();
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Get lecturer by ID',
		description: 'Retrieve specific lecturer profile by user ID.',
	})
	async findOne(@Param('id') id: string) {
		return await this.lecturerService.findOne(id);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@Put()
	@ApiOperation({
		summary: 'Update lecturer profile',
		description: 'Update current lecturer own profile information.',
	})
	async update(@Req() req: Request, @Body() dto: UpdateUserDto) {
		const user = req.user as UserPayload;

		return await this.lecturerService.update(user.id, dto);
	}

	@Roles(Role.ADMIN)
	@Put(':id')
	@ApiOperation({
		summary: 'Update lecturer by admin',
		description: 'Admin update any lecturer profile including email.',
	})
	async updateByAdmin(@Param('id') id: string, @Body() dto: UpdateLecturerDto) {
		return await this.lecturerService.updateByAdmin(id, dto);
	}

	@Roles(Role.ADMIN)
	@Post(':id/toggle-status')
	@ApiOperation({
		summary: 'Toggle lecturer status',
		description: 'Toggle lecturer active status and moderator role.',
	})
	async toggleStatus(
		@Param('id') id: string,
		@Body() dto: ToggleLecturerStatusDto,
	) {
		return await this.lecturerService.toggleStatus(id, dto);
	}

	@Roles(Role.ADMIN)
	@Delete(':id')
	@ApiOperation({
		summary: 'Delete lecturer',
		description: 'Delete lecturer account if no active assignments exist.',
	})
	async delete(@Param('id') id: string) {
		return await this.lecturerService.delete(id);
	}
}
