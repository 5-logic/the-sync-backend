import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Put,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { ThesisModeratorDocs } from '@/theses/docs';
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

	@HttpCode(HttpStatus.OK)
	@Put('publish')
	@ApiOperation(ThesisModeratorDocs.publishTheses)
	@Roles(Role.MODERATOR)
	async publishTheses(@Body() dto: PublishThesisDto) {
		return await this.thesisModeratorService.publishTheses(dto);
	}

	@HttpCode(HttpStatus.OK)
	@Post(':id/review')
	@ApiOperation(ThesisModeratorDocs.reviewThesis)
	@Roles(Role.MODERATOR)
	async reviewThesis(@Param('id') id: string, @Body() dto: ReviewThesisDto) {
		return await this.thesisModeratorService.reviewThesis(id, dto);
	}

	@HttpCode(HttpStatus.OK)
	@Post(':id/assign')
	@ApiOperation(ThesisModeratorDocs.assignThesis)
	@Roles(Role.MODERATOR)
	async assignThesis(@Param('id') id: string, @Body() dto: AssignThesisDto) {
		return await this.thesisModeratorService.assignThesis(id, dto);
	}
}
