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
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import { SwaggerDoc } from '@/common/docs/swagger-docs.decorator';
import { ToggleLecturerStatusDto, UpdateLecturerDto } from '@/lecturers/dto';
import { CreateUserDto, UpdateUserDto } from '@/users/dto';

import { LecturerService } from '~/src/domains/lecturers/services/lecturer.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Lecturer')
@Controller('lecturers')
export class LecturerController {
	constructor(private readonly lecturerService: LecturerService) {}

	@Roles(Role.ADMIN)
	@Post()
	@SwaggerDoc('lecturer', 'create')
	async create(@Body() dto: CreateUserDto) {
		return await this.lecturerService.create(dto);
	}

	@Roles(Role.ADMIN)
	@ApiBody({ type: [CreateUserDto] })
	@Post('import')
	@SwaggerDoc('lecturer', 'createMany')
	async createMany(@Body() dto: CreateUserDto[]) {
		return await this.lecturerService.createMany(dto);
	}

	@Get()
	@SwaggerDoc('lecturer', 'findAll')
	async findAll() {
		return await this.lecturerService.findAll();
	}

	@Get(':id')
	@SwaggerDoc('lecturer', 'findOne')
	async findOne(@Param('id') id: string) {
		return await this.lecturerService.findOne(id);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@Put()
	@SwaggerDoc('lecturer', 'update')
	async update(@Req() req: Request, @Body() dto: UpdateUserDto) {
		const user = req.user as UserPayload;

		return await this.lecturerService.update(user.id, dto);
	}

	@Roles(Role.ADMIN)
	@Put(':id')
	@SwaggerDoc('lecturer', 'updateByAdmin')
	async updateByAdmin(@Param('id') id: string, @Body() dto: UpdateLecturerDto) {
		return await this.lecturerService.updateByAdmin(id, dto);
	}

	@Roles(Role.ADMIN)
	@Post(':id/toggle-status')
	@SwaggerDoc('lecturer', 'toggleStatus')
	async toggleStatus(
		@Param('id') id: string,
		@Body() dto: ToggleLecturerStatusDto,
	) {
		return await this.lecturerService.toggleStatus(id, dto);
	}

	@Roles(Role.ADMIN)
	@Delete(':id')
	@SwaggerDoc('lecturer', 'delete')
	async delete(@Param('id') id: string) {
		return await this.lecturerService.delete(id);
	}
}
