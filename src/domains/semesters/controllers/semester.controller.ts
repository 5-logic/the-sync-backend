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
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { ApiArrayResponse, ApiBaseResponse } from '@/common';
import { SEMESTER_API_TAGS, SEMESTER_CONSTANTS } from '@/semesters/constants';
import { SemesterDocs } from '@/semesters/docs';
import { CreateSemesterDto, UpdateSemesterDto } from '@/semesters/dto';
import { SemesterResponse } from '@/semesters/responses';
import { SemesterService } from '@/semesters/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(SEMESTER_API_TAGS)
@Controller(SEMESTER_CONSTANTS.BASE)
export class SemesterController {
	constructor(private readonly service: SemesterService) {}

	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.CREATED)
	@Post()
	@ApiOperation(SemesterDocs.create)
	@ApiBaseResponse(SemesterResponse, HttpStatus.CREATED)
	async create(@Body() dto: CreateSemesterDto): Promise<SemesterResponse> {
		return await this.service.create(dto);
	}

	@HttpCode(HttpStatus.OK)
	@Get()
	@ApiOperation(SemesterDocs.findAll)
	@ApiArrayResponse(SemesterResponse, HttpStatus.OK)
	async findAll(): Promise<SemesterResponse[]> {
		return await this.service.findAll();
	}

	@HttpCode(HttpStatus.OK)
	@Get(':id')
	@ApiOperation(SemesterDocs.findOne)
	@ApiBaseResponse(SemesterResponse, HttpStatus.OK)
	async findOne(@Param('id') id: string): Promise<SemesterResponse> {
		return await this.service.findOne(id);
	}

	@Roles(Role.ADMIN, Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@ApiOperation(SemesterDocs.getStatistics)
	@Get(':id/statistics')
	async getStatistics(@Param('id') id: string) {
		return await this.service.getStatistics(id);
	}

	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.OK)
	@Put(':id')
	@ApiOperation(SemesterDocs.update)
	@ApiBaseResponse(SemesterResponse, HttpStatus.OK)
	async update(
		@Param('id') id: string,
		@Body() dto: UpdateSemesterDto,
	): Promise<SemesterResponse> {
		return await this.service.update(id, dto);
	}

	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.OK)
	@Delete(':id')
	@ApiOperation(SemesterDocs.remove)
	@ApiBaseResponse(SemesterResponse, HttpStatus.OK)
	async remove(@Param('id') id: string): Promise<SemesterResponse> {
		return await this.service.remove(id);
	}
}
