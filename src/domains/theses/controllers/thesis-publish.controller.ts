import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard } from '@/auth';
import { ThesisPublishDocs } from '@/theses/docs';
import { ThesisPublishService } from '@/theses/services/thesis-publish.service';

@UseGuards(JwtAccessAuthGuard)
@ApiBearerAuth()
@ApiTags('Thesis - Public')
@Controller('theses')
export class ThesisPublishController {
	constructor(private readonly thesisPublishService: ThesisPublishService) {}

	@HttpCode(HttpStatus.OK)
	@Get()
	@ApiOperation(ThesisPublishDocs.findAll)
	async findAll() {
		return await this.thesisPublishService.findAll();
	}

	@HttpCode(HttpStatus.OK)
	@Get('semester/:semesterId')
	@ApiOperation(ThesisPublishDocs.findAllBySemesterId)
	async findAllBySemesterId(@Param('semesterId') semesterId: string) {
		return await this.thesisPublishService.findAllBySemesterId(semesterId);
	}

	@HttpCode(HttpStatus.OK)
	@Get(':id')
	@ApiOperation(ThesisPublishDocs.findOne)
	async findOne(@Param('id') id: string) {
		return await this.thesisPublishService.findOne(id);
	}
}
