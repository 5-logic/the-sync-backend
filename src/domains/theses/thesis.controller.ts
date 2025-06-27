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
import { FastifyRequest } from 'fastify';

import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/enums/role.enum';
import { JwtAccessAuthGuard } from '@/auth/guards/jwt-access.guard';
import { RoleGuard } from '@/auth/guards/role.guard';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import { CreateThesisDto } from '@/theses/dto/create-thesis.dto';
import { ReviewThesisDto } from '@/theses/dto/review-thesis.dto';
import { UpdateThesisDto } from '@/theses/dto/update-thesis.dto';
import { ThesisService } from '@/theses/thesis.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Thesis')
@Controller('theses')
export class ThesisController {
	constructor(private readonly thesisService: ThesisService) {}

	@Roles(Role.MODERATOR, Role.LECTURER)
	@Post()
	async create(@Req() req: FastifyRequest, @Body() dto: CreateThesisDto) {
		const user = req.user as UserPayload;

		return await this.thesisService.create(user.id, dto);
	}

	@Get()
	async findAll() {
		return await this.thesisService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.thesisService.findOne(id);
	}

	@Roles(Role.MODERATOR, Role.LECTURER)
	@Put(':id')
	async update(
		@Req() req: FastifyRequest,
		@Param('id') id: string,
		@Body() dto: UpdateThesisDto,
	) {
		const user = req.user as UserPayload;

		return await this.thesisService.update(user.id, id, dto);
	}

	@Roles(Role.MODERATOR, Role.LECTURER)
	@Post(':id/submit')
	async submitForReview(@Req() req: FastifyRequest, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.thesisService.submitForReview(user.id, id);
	}

	@Roles(Role.MODERATOR)
	@Post(':id/review')
	async reviewThesis(@Param('id') id: string, @Body() dto: ReviewThesisDto) {
		return await this.thesisService.reviewThesis(id, dto);
	}

	@Roles(Role.MODERATOR, Role.LECTURER)
	@Delete(':id')
	async remove(@Req() req: FastifyRequest, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.thesisService.remove(user.id, id);
	}
}
