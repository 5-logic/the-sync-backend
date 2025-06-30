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
import { ToggleLecturerStatusDto, UpdateLecturerDto } from '@/lecturers/dto';
import { LecturerService } from '@/lecturers/lecturer.service';
import {
	CreateUserDto,
	UpdateUserDto,
	UpdateUserPasswordDto,
} from '@/users/dto';
import { UserService } from '@/users/user.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Lecturer')
@Controller('lecturers')
export class LecturerController {
	constructor(
		private readonly lecturerService: LecturerService,
		private readonly userService: UserService,
	) {}

	@Roles(Role.ADMIN)
	@Post()
	async create(@Body() dto: CreateUserDto) {
		return await this.lecturerService.create(dto);
	}

	@Roles(Role.ADMIN)
	@ApiBody({ type: [CreateUserDto] })
	@Post('import')
	async createMany(@Body() dto: CreateUserDto[]) {
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
	async update(@Req() req: Request, @Body() dto: UpdateUserDto) {
		const user = req.user as UserPayload;

		return await this.lecturerService.update(user.id, dto);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@Put('change-password')
	async changePassword(
		@Req() req: Request,
		@Body() dto: UpdateUserPasswordDto,
	) {
		const user = req.user as UserPayload;
		return await this.userService.changePassword(user.id, dto);
	}

	@Roles(Role.ADMIN)
	@Put(':id')
	async updateByAdmin(@Param('id') id: string, @Body() dto: UpdateLecturerDto) {
		return await this.lecturerService.updateByAdmin(id, dto);
	}

	@Roles(Role.ADMIN)
	@Post(':id/toggle-status')
	async toggleStatus(
		@Param('id') id: string,
		@Body() dto: ToggleLecturerStatusDto,
	) {
		return await this.lecturerService.toggleStatus(id, dto);
	}

	@Roles(Role.ADMIN)
	@Delete(':id')
	async delete(@Param('id') id: string) {
		return await this.lecturerService.delete(id);
	}
}
