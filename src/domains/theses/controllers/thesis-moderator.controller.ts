import { Body, Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { SwaggerDoc } from '@/common/docs/swagger-docs.decorator';
import {
	AssignThesisDto,
	PublishThesisDto,
	ReviewThesisDto,
} from '@/theses/dtos';
import { ThesisModeratorService } from '@/theses/services/thesis-moderator.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Thesis - Moderator')
@Controller('theses')
export class ThesisModeratorController {
	constructor(
		private readonly thesisModeratorService: ThesisModeratorService,
	) {}

	@SwaggerDoc('thesis', 'publishTheses')
	@Roles(Role.MODERATOR)
	@Put('publish')
	async publishTheses(@Body() dto: PublishThesisDto) {
		return await this.thesisModeratorService.publishTheses(dto);
	}

	@SwaggerDoc('thesis', 'reviewThesis')
	@Roles(Role.MODERATOR)
	@Post(':id/review')
	async reviewThesis(@Param('id') id: string, @Body() dto: ReviewThesisDto) {
		return await this.thesisModeratorService.reviewThesis(id, dto);
	}

	@SwaggerDoc('thesis', 'assignThesis')
	@Roles(Role.MODERATOR)
	@Post(':id/assign')
	async assignThesis(@Param('id') id: string, @Body() dto: AssignThesisDto) {
		return await this.thesisModeratorService.assignThesis(id, dto);
	}
}
