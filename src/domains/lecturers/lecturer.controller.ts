import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Put,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/enums/role.enum';
import { JwtAccessAuthGuard } from '@/auth/guards/jwt-access.guard';
import { RoleGuard } from '@/auth/guards/role.guard';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import { CreateLecturerDto } from '@/lecturers/dto/create-lecturer.dto';
import { ToggleLecturerStatusDto } from '@/lecturers/dto/toggle-lecturer-status.dto';
import { UpdateLecturerDto } from '@/lecturers/dto/update-lecturer.dto';
import { LecturerService } from '@/lecturers/lecturer.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Lecturer')
@Controller('lecturers')
export class LecturerController {
	constructor(private readonly lecturerService: LecturerService) {}

	@Roles(Role.ADMIN)
	@Post()
	async create(@Body() dto: CreateLecturerDto) {
		return await this.lecturerService.create(dto);
	}

	@Roles(Role.ADMIN)
	@ApiBody({ type: [CreateLecturerDto] })
	@Post('import')
	async createMany(@Body() dto: CreateLecturerDto[]) {
		return await this.lecturerService.createMany(dto);
	}

	@Get()
	async findAll() {
		return await this.lecturerService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.lecturerService.findOne(id);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@Put()
	async update(@Req() request: Request, @Body() dto: UpdateLecturerDto) {
		const user = request.user as UserPayload;

		return await this.lecturerService.update(user.id, dto);
	}

	@Roles(Role.ADMIN)
	@Post(':id/toggle-status')
	async toggleStatus(
		@Param('id') id: string,
		@Body() dto: ToggleLecturerStatusDto,
	) {
		return await this.lecturerService.toggleStatus(id, dto);
	}
}
