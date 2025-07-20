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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import { SwaggerDoc } from '@/common/docs/swagger-docs.decorator';
import { CreateThesisDto, UpdateThesisDto } from '@/theses/dtos';
import { ThesisLecturerService } from '@/theses/services/thesis-lecturer.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Thesis - Lecturer')
@Controller('theses')
export class ThesisLecturerController {
	constructor(private readonly thesisLecturerService: ThesisLecturerService) {}

	@SwaggerDoc('thesis', 'create')
	@Roles(Role.MODERATOR, Role.LECTURER)
	@Post()
	async create(@Req() req: Request, @Body() dto: CreateThesisDto) {
		const user = req.user as UserPayload;

		return await this.thesisLecturerService.create(user.id, dto);
	}

	@SwaggerDoc('thesis', 'findAllByLecturerId')
	@Roles(Role.LECTURER, Role.MODERATOR)
	@Get('lecturer/:lecturerId')
	async findAllByLecturerId(@Param('lecturerId') lecturerId: string) {
		return await this.thesisLecturerService.findAllByLecturerId(lecturerId);
	}

	@SwaggerDoc('thesis', 'update')
	@Roles(Role.MODERATOR, Role.LECTURER)
	@Put(':id')
	async update(
		@Req() req: Request,
		@Param('id') id: string,
		@Body() dto: UpdateThesisDto,
	) {
		const user = req.user as UserPayload;

		return await this.thesisLecturerService.update(user.id, id, dto);
	}

	@SwaggerDoc('thesis', 'submitForReview')
	@Roles(Role.MODERATOR, Role.LECTURER)
	@Post(':id/submit')
	async submitForReview(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.thesisLecturerService.submitForReview(user.id, id);
	}

	@SwaggerDoc('thesis', 'remove')
	@Roles(Role.MODERATOR, Role.LECTURER)
	@Delete(':id')
	async remove(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.thesisLecturerService.remove(user.id, id);
	}
}
