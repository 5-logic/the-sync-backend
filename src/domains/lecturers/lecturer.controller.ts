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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import { ToggleLecturerStatusDto, UpdateLecturerDto } from '@/lecturers/dto';
import { LecturerService } from '@/lecturers/lecturer.service';
import { CreateUserDto, UpdateUserDto } from '@/users/dto';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Lecturer')
@Controller('lecturers')
export class LecturerController {
	constructor(private readonly lecturerService: LecturerService) {}

	@Roles(Role.ADMIN)
	@Post()
	@ApiOperation({
		summary: 'Create lecturer',
		description:
			'Create a new lecturer account with automatic password generation and email verification. The system generates a secure password, creates the user profile, assigns lecturer role, and sends a welcome email with login credentials. Only admins can create new lecturer accounts.',
	})
	async create(@Body() dto: CreateUserDto) {
		return await this.lecturerService.create(dto);
	}

	@Roles(Role.ADMIN)
	@ApiBody({ type: [CreateUserDto] })
	@Post('import')
	@ApiOperation({
		summary: 'Import lecturers',
		description:
			'Bulk import multiple lecturer accounts from an array of user data. Each lecturer gets an auto-generated secure password and welcome email. Validates all entries before processing, ensures no duplicate emails, and performs the creation in a transaction for data integrity. Useful for mass onboarding of faculty members.',
	})
	async createMany(@Body() dto: CreateUserDto[]) {
		return await this.lecturerService.createMany(dto);
	}

	@Get()
	@ApiOperation({
		summary: 'Get all lecturers',
		description:
			'Retrieve a comprehensive list of all lecturers in the system with their profile information including name, email, contact details, and moderator status. Results are cached for performance and ordered by creation date (newest first). Accessible to all authenticated users for academic collaboration purposes.',
	})
	async findAll() {
		return await this.lecturerService.findAll();
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Get lecturer by ID',
		description:
			'Retrieve detailed profile information for a specific lecturer by their unique user ID. Returns complete lecturer data including personal information, contact details, academic status, and moderator privileges. Used for viewing lecturer profiles, thesis supervision assignments, and administrative management.',
	})
	async findOne(@Param('id') id: string) {
		return await this.lecturerService.findOne(id);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@Put()
	@ApiOperation({
		summary: 'Update lecturer profile',
		description:
			'Allow lecturers to update their own profile information including full name, contact details, and personal preferences. Lecturers can only modify their own profiles and cannot change their email address or role permissions. Changes are validated and cached data is invalidated for consistency.',
	})
	async update(@Req() req: Request, @Body() dto: UpdateUserDto) {
		const user = req.user as UserPayload;

		return await this.lecturerService.update(user.id, dto);
	}

	@Roles(Role.ADMIN)
	@Put(':id')
	@ApiOperation({
		summary: 'Update lecturer by admin',
		description:
			'Administrative update of any lecturer profile with extended permissions including email modification. Admins can update all lecturer information including sensitive data like email addresses and personal details. Includes comprehensive validation and maintains data integrity across the system.',
	})
	async updateByAdmin(@Param('id') id: string, @Body() dto: UpdateLecturerDto) {
		return await this.lecturerService.updateByAdmin(id, dto);
	}

	@Roles(Role.ADMIN)
	@Post(':id/toggle-status')
	@ApiOperation({
		summary: 'Toggle lecturer status',
		description:
			'Administrative control to toggle lecturer account status (active/inactive) and moderator privileges. Allows admins to activate/deactivate lecturer accounts and grant/revoke moderator permissions for thesis supervision and group management. Status changes are immediately effective and logged for audit purposes.',
	})
	async toggleStatus(
		@Param('id') id: string,
		@Body() dto: ToggleLecturerStatusDto,
	) {
		return await this.lecturerService.toggleStatus(id, dto);
	}

	@Roles(Role.ADMIN)
	@Delete(':id')
	@ApiOperation({
		summary: 'Delete lecturer',
		description:
			'Permanently delete a lecturer account from the system with comprehensive validation checks. Prevents deletion if the lecturer has active assignments, supervisions, thesis reviews, or moderator responsibilities. Only inactive lecturers with no academic dependencies can be deleted to maintain data integrity.',
	})
	async delete(@Param('id') id: string) {
		return await this.lecturerService.delete(id);
	}
}
