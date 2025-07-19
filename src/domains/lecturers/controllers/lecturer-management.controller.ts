import {
	Body,
	Controller,
	Delete,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Put,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { ApiArrayResponse, ApiEmptyResponse } from '@/common';
import { LECTURER_API_TAGS, LECTURER_CONSTANTS } from '@/lecturers/constants';
import { LecturerManagementDocs } from '@/lecturers/docs';
import { ToggleLecturerStatusDto, UpdateLecturerDto } from '@/lecturers/dto';
import { LecturerResponse } from '@/lecturers/responses';
import { LecturerManagementService } from '@/lecturers/services';
import { CreateUserDto } from '@/users/index';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(LECTURER_API_TAGS)
@Controller(LECTURER_CONSTANTS.BASE)
export class LecturerManagementController {
	constructor(private readonly service: LecturerManagementService) {}

	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.CREATED)
	@Post()
	@ApiOperation(LecturerManagementDocs.create)
	@ApiArrayResponse(LecturerResponse, HttpStatus.CREATED)
	async create(@Body() dto: CreateUserDto): Promise<LecturerResponse> {
		return await this.service.create(dto);
	}

	@Roles(Role.ADMIN)
	@ApiBody({ type: [CreateUserDto] })
	@HttpCode(HttpStatus.CREATED)
	@Post('import')
	@ApiOperation(LecturerManagementDocs.createMany)
	@ApiArrayResponse(LecturerResponse, HttpStatus.CREATED)
	async createMany(@Body() dto: CreateUserDto[]): Promise<LecturerResponse[]> {
		return await this.service.createMany(dto);
	}

	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.OK)
	@Put(':id')
	@ApiOperation(LecturerManagementDocs.updateByAdmin)
	@ApiEmptyResponse(HttpStatus.OK)
	async updateByAdmin(
		@Param('id') id: string,
		@Body() dto: UpdateLecturerDto,
	): Promise<LecturerResponse> {
		return await this.service.updateByAdmin(id, dto);
	}

	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.OK)
	@Post(':id/toggle-status')
	@ApiOperation(LecturerManagementDocs.toggleStatus)
	@ApiEmptyResponse(HttpStatus.OK)
	async toggleStatus(
		@Param('id') id: string,
		@Body() dto: ToggleLecturerStatusDto,
	): Promise<LecturerResponse> {
		return await this.service.toggleStatus(id, dto);
	}

	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.OK)
	@Delete(':id')
	@ApiOperation(LecturerManagementDocs.delete)
	@ApiEmptyResponse(HttpStatus.OK)
	async remove(@Param('id') id: string): Promise<LecturerResponse> {
		return await this.service.remove(id);
	}
}
