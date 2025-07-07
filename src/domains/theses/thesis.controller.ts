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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import {
	AssignThesisDto,
	CreateThesisDto,
	PublishThesisDto,
	ReviewThesisDto,
	UpdateThesisDto,
} from '@/theses/dto';
import { ThesisService } from '@/theses/thesis.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Thesis')
@Controller('theses')
export class ThesisController {
	constructor(private readonly thesisService: ThesisService) {}

	@ApiOperation({
		summary: 'Create new thesis',
		description:
			'Creates a new thesis project proposal. This endpoint allows lecturers and moderators to create thesis proposals with detailed specifications including title, description, domain, required skills, and expected outcomes. The requesting user must have LECTURER or MODERATOR role privileges. Validates thesis data completeness, checks for title uniqueness within semester, and creates thesis record with proper status tracking. Includes automatic notification system for related users. Used in academic workflow when proposing new thesis topics for student selection.',
	})
	@Roles(Role.MODERATOR, Role.LECTURER)
	@Post()
	async create(@Req() req: Request, @Body() dto: CreateThesisDto) {
		const user = req.user as UserPayload;

		return await this.thesisService.create(user.id, dto);
	}

	@ApiOperation({
		summary: 'Get all theses',
		description:
			'Retrieves a comprehensive list of all thesis projects in the system. This endpoint returns detailed information about theses including titles, descriptions, status, supervisor assignments, student enrollments, and metadata. Supports filtering and pagination for efficient data retrieval. Used in academic management to view thesis portfolio, track project progress, and monitor thesis distribution across semesters and departments. Accessible to authenticated users with appropriate permissions.',
	})
	@Get()
	async findAll() {
		return await this.thesisService.findAll();
	}

	@ApiOperation({
		summary: 'Get theses by semester',
		description:
			'Retrieves all thesis projects associated with a specific semester. This endpoint returns comprehensive thesis information filtered by semester including project details, status, supervisor assignments, and student enrollments. Includes semester-specific metadata and filtering options. Used in academic planning to view thesis offerings per semester, track semester-specific thesis distribution, and manage academic calendar coordination. Essential for semester-based thesis management and student course planning.',
	})
	@Get('semester/:semesterId')
	async findAllBySemesterId(@Param('semesterId') semesterId: string) {
		return await this.thesisService.findAllBySemesterId(semesterId);
	}

	@ApiOperation({
		summary: 'Get thesis by ID',
		description:
			'Retrieves detailed information about a specific thesis project by its unique identifier. This endpoint returns comprehensive thesis data including title, description, domain, required skills, status, supervision details, student assignments, milestones, and progress tracking. Includes related entities such as supervisor information, student enrollment data, and thesis requirements. Used in thesis management for detailed view, progress monitoring, and administrative oversight.',
	})
	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.thesisService.findOne(id);
	}

	@ApiOperation({
		summary: 'Get theses by lecturer',
		description:
			'Retrieves all thesis projects supervised or created by a specific lecturer. This endpoint returns comprehensive information about theses associated with the lecturer including supervision assignments, thesis proposals, project status, and student enrollments. The requesting user must have LECTURER or MODERATOR role privileges. Used in lecturer management to view supervision portfolio, track workload distribution, and manage academic responsibilities. Essential for lecturer dashboard and supervision oversight.',
	})
	@Roles(Role.LECTURER, Role.MODERATOR)
	@Get('lecturer/:lecturerId')
	async findAllByLecturerId(@Param('lecturerId') lecturerId: string) {
		return await this.thesisService.findAllByLecturerId(lecturerId);
	}

	@ApiOperation({
		summary: 'Publish theses for student selection',
		description:
			'Publishes a batch of thesis projects making them available for student selection and enrollment. This endpoint transitions thesis status to published state, enabling student access for selection process. The requesting user must have MODERATOR role privileges. Validates thesis readiness for publication, checks completion of required information, and updates thesis visibility settings. Includes automatic notification system for students and related stakeholders. Used in academic workflow when opening thesis selection periods.',
	})
	@Roles(Role.MODERATOR)
	@Put('publish')
	async publishTheses(@Body() dto: PublishThesisDto) {
		return await this.thesisService.publishTheses(dto);
	}

	@ApiOperation({
		summary: 'Update thesis information',
		description:
			'Updates detailed information of a specific thesis project. This endpoint allows modification of thesis properties including title, description, domain, required skills, expected outcomes, and requirements. The requesting user must have LECTURER or MODERATOR role privileges and appropriate permissions for the thesis. Validates data integrity, checks for title uniqueness, and maintains audit trail of changes. Includes automatic notification system for affected stakeholders. Used in thesis management for content updates and requirement modifications.',
	})
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

	@ApiOperation({
		summary: 'Submit thesis for review',
		description:
			'Submits a thesis project for administrative review and approval process. This endpoint transitions thesis status to review state, triggering evaluation workflow by academic moderators. The requesting user must have LECTURER or MODERATOR role privileges and be associated with the thesis. Validates thesis completeness, checks required information availability, and initiates review process. Includes automatic notification system for reviewers and stakeholders. Used in academic workflow when thesis proposals are ready for evaluation.',
	})
	@Roles(Role.MODERATOR, Role.LECTURER)
	@Post(':id/submit')
	async submitForReview(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.thesisService.submitForReview(user.id, id);
	}

	@ApiOperation({
		summary: 'Review and approve/reject thesis',
		description:
			'Conducts administrative review of a submitted thesis project with approval or rejection decision. This endpoint allows moderators to evaluate thesis proposals, provide feedback, and determine acceptance status. The requesting user must have MODERATOR role privileges. Validates review criteria, processes feedback comments, and updates thesis status accordingly. Includes automatic notification system for thesis creators and related stakeholders. Used in academic workflow for thesis proposal evaluation and quality assurance.',
	})
	@Roles(Role.MODERATOR)
	@Post(':id/review')
	async reviewThesis(@Param('id') id: string, @Body() dto: ReviewThesisDto) {
		return await this.thesisService.reviewThesis(id, dto);
	}

	@ApiOperation({
		summary: 'Assign thesis to group',
		description:
			'Assigns a thesis project to a specific student group, creating the thesis-group enrollment relationship. This endpoint facilitates the thesis allocation process by connecting approved groups with available thesis projects. The requesting user must have MODERATOR role privileges. Validates group eligibility, checks thesis availability, and creates assignment record with proper status tracking. Includes automatic notification system for group members, supervisors, and related stakeholders. Used in academic workflow for thesis allocation and group enrollment management.',
	})
	@Roles(Role.MODERATOR)
	@Post(':id/assign')
	async assignThesis(@Param('id') id: string, @Body() dto: AssignThesisDto) {
		return await this.thesisService.assignThesis(id, dto);
	}

	@ApiOperation({
		summary: 'Delete thesis project',
		description:
			'Permanently removes a thesis project from the system. This endpoint allows deletion of thesis records including all associated data such as student assignments, supervision relationships, and progress tracking. The requesting user must have LECTURER or MODERATOR role privileges and appropriate permissions for the thesis. Validates deletion eligibility, checks for active dependencies, and performs cascade deletion of related records. Includes automatic notification system for affected stakeholders. Used in thesis management for cleanup and administrative purposes.',
	})
	@Roles(Role.MODERATOR, Role.LECTURER)
	@Delete(':id')
	async remove(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.thesisService.remove(user.id, id);
	}
}
