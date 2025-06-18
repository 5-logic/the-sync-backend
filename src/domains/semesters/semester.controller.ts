import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Put,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/enums/role.enum';
import { JwtAccessAuthGuard } from '@/auth/guards/jwt-access.guard';
import { RoleGuard } from '@/auth/guards/role.guard';
import { CreateSemesterDto } from '@/semesters/dto/create-semester.dto';
import { UpdateSemesterDto } from '@/semesters/dto/update-semester.dto';
import { SemesterService } from '@/semesters/semester.service';

@UseGuards(RoleGuard)
@UseGuards(JwtAccessAuthGuard)
@ApiBearerAuth()
@ApiTags('Semester')
@Controller('semesters')
export class SemesterController {
	constructor(private readonly semesterService: SemesterService) {}

	@Roles(Role.ADMIN)
	@Post()
	async create(@Body() createSemesterDto: CreateSemesterDto) {
		return await this.semesterService.create(createSemesterDto);
	}

	@Roles(Role.ADMIN, Role.LECTURER, Role.MODERATOR, Role.STUDENT)
	@Get()
	async findAll() {
		return await this.semesterService.findAll();
	}

	@Roles(Role.ADMIN, Role.LECTURER, Role.MODERATOR, Role.STUDENT)
	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.semesterService.findOne(id);
	}

	@Roles(Role.ADMIN)
	@Put(':id')
	async update(
		@Param('id') id: string,
		@Body() updateSemesterDto: UpdateSemesterDto,
	) {
		return await this.semesterService.update(id, updateSemesterDto);
	}
}
