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
import {
	AssignThesisDto,
	CreateThesisDto,
	PublishThesisDto,
	ReviewThesisDto,
	UpdateThesisDto,
} from '@/theses/dtos';
import { ThesisService } from '@/theses/thesis.service';

// @UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Thesis')
@Controller('theses')
export class ThesisController {
	constructor(private readonly thesisService: ThesisService) {}

	@SwaggerDoc('thesis', 'create')
	@Roles(Role.MODERATOR, Role.LECTURER)
	@Post()
	async create(@Req() req: Request, @Body() dto: CreateThesisDto) {
		const user = req.user as UserPayload;

		return await this.thesisService.create(user.id, dto);
	}

	@SwaggerDoc('thesis', 'findAll')
	@Get()
	async findAll() {
		return await this.thesisService.findAll();
	}

	@SwaggerDoc('thesis', 'findAllBySemesterId')
	@Get('semester/:semesterId')
	async findAllBySemesterId(@Param('semesterId') semesterId: string) {
		return await this.thesisService.findAllBySemesterId(semesterId);
	}

	@SwaggerDoc('thesis', 'findOne')
	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.thesisService.findOne(id);
	}

	@SwaggerDoc('thesis', 'findAllByLecturerId')
	@Roles(Role.LECTURER, Role.MODERATOR)
	@Get('lecturer/:lecturerId')
	async findAllByLecturerId(@Param('lecturerId') lecturerId: string) {
		return await this.thesisService.findAllByLecturerId(lecturerId);
	}

	@SwaggerDoc('thesis', 'publishTheses')
	@Roles(Role.MODERATOR)
	@Put('publish')
	async publishTheses(@Body() dto: PublishThesisDto) {
		return await this.thesisService.publishTheses(dto);
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

		return await this.thesisService.update(user.id, id, dto);
	}

	@SwaggerDoc('thesis', 'submitForReview')
	@Roles(Role.MODERATOR, Role.LECTURER)
	@Post(':id/submit')
	async submitForReview(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.thesisService.submitForReview(user.id, id);
	}

	@SwaggerDoc('thesis', 'reviewThesis')
	@Roles(Role.MODERATOR)
	@Post(':id/review')
	async reviewThesis(@Param('id') id: string, @Body() dto: ReviewThesisDto) {
		return await this.thesisService.reviewThesis(id, dto);
	}

	@SwaggerDoc('thesis', 'assignThesis')
	@Roles(Role.MODERATOR)
	@Post(':id/assign')
	async assignThesis(@Param('id') id: string, @Body() dto: AssignThesisDto) {
		return await this.thesisService.assignThesis(id, dto);
	}

	@SwaggerDoc('thesis', 'remove')
	@Roles(Role.MODERATOR, Role.LECTURER)
	@Delete(':id')
	async remove(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.thesisService.remove(user.id, id);
	}
}
