import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Put,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import { ThesisLecturerDocs } from '@/theses/docs';
import { CreateThesisDto, UpdateThesisDto } from '@/theses/dtos';
import { ThesisLecturerService } from '@/theses/services/thesis-lecturer.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Thesis - Lecturer')
@Controller('theses')
export class ThesisLecturerController {
	constructor(private readonly thesisLecturerService: ThesisLecturerService) {}

	@HttpCode(HttpStatus.CREATED)
	@Post()
	@ApiOperation(ThesisLecturerDocs.create)
	@Roles(Role.MODERATOR, Role.LECTURER)
	async create(@Req() req: Request, @Body() dto: CreateThesisDto) {
		const user = req.user as UserPayload;

		return await this.thesisLecturerService.create(user.id, dto);
	}

	@HttpCode(HttpStatus.OK)
	@Get('lecturer/:lecturerId')
	@ApiOperation(ThesisLecturerDocs.findAllByLecturerId)
	@Roles(Role.LECTURER, Role.MODERATOR)
	async findAllByLecturerId(@Param('lecturerId') lecturerId: string) {
		return await this.thesisLecturerService.findAllByLecturerId(lecturerId);
	}

	@HttpCode(HttpStatus.OK)
	@Put(':id')
	@ApiOperation(ThesisLecturerDocs.update)
	@Roles(Role.MODERATOR, Role.LECTURER)
	async update(
		@Req() req: Request,
		@Param('id') id: string,
		@Body() dto: UpdateThesisDto,
	) {
		const user = req.user as UserPayload;

		return await this.thesisLecturerService.update(user.id, id, dto);
	}

	@HttpCode(HttpStatus.OK)
	@Post(':id/submit')
	@ApiOperation(ThesisLecturerDocs.submitForReview)
	@Roles(Role.MODERATOR, Role.LECTURER)
	async submitForReview(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.thesisLecturerService.submitForReview(user.id, id);
	}

	@HttpCode(HttpStatus.OK)
	@Delete(':id')
	@ApiOperation(ThesisLecturerDocs.remove)
	@Roles(Role.MODERATOR, Role.LECTURER)
	async remove(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.thesisLecturerService.remove(user.id, id);
	}
}
