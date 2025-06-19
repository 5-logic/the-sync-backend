import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Put,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/enums/role.enum';
import { JwtAccessAuthGuard } from '@/auth/guards/jwt-access.guard';
import { RoleGuard } from '@/auth/guards/role.guard';
import { CreateLecturerDto } from '@/lecturers/dto/create-lecturer.dto';
import { UpdateLecturerDto } from '@/lecturers/dto/update-lecturer.dto';
import { LecturerService } from '@/lecturers/lecturer.service';

@UseGuards(RoleGuard)
@UseGuards(JwtAccessAuthGuard)
@ApiBearerAuth()
@ApiTags('Lecturer')
@Controller('lecturers')
export class LecturerController {
	constructor(private readonly lecturerService: LecturerService) {}

	@Roles(Role.ADMIN)
	@Post()
	async create(@Body() createLecturerDto: CreateLecturerDto) {
		return await this.lecturerService.create(createLecturerDto);
	}

	@Roles(Role.ADMIN)
	@ApiBody({ type: [CreateLecturerDto] })
	@Post('import')
	async createMany(@Body() createLecturerDtos: CreateLecturerDto[]) {
		return await this.lecturerService.createMany(createLecturerDtos);
	}

	@Get()
	async findAll() {
		return await this.lecturerService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.lecturerService.findOne(id);
	}

	@Roles(Role.ADMIN, Role.LECTURER, Role.MODERATOR)
	@Put(':id')
	async update(
		@Param('id') id: string,
		@Body() updateLecturerDto: UpdateLecturerDto,
	) {
		return await this.lecturerService.update(id, updateLecturerDto);
	}
}
